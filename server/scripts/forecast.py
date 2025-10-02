#!/usr/bin/env python3
"""
forecast.py

Reads daily revenue JSON and produces a small forecast window for each branch.

Usage:
  python forecast.py server/scripts/output/daily_revenue.json

Output:
  server/scripts/output/forecast_output.json

Behavior:
- Tries to use pandas and statsmodels' ExponentialSmoothing for Holt-Winters.
- If unavailable, falls back to a simple rolling-mean forecast.
- Produces a 14-day window: 7 days past, today, 6 days future.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List
import os

try:
    from dotenv import load_dotenv
except ImportError:
    print("Warning: python-dotenv not installed. Environment variables from .env file won't be loaded.")
    load_dotenv = None

try:
    import pandas as pd
    HAVE_PANDAS = True
except Exception:
    HAVE_PANDAS = False

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    HAVE_HW = True
except Exception:
    HAVE_HW = False

# Try Prophet (two possible package names)
HAVE_PROPHET = False
PROPHET = None
try:
    from prophet import Prophet as _Prophet
    HAVE_PROPHET = True
    PROPHET = _Prophet
except Exception:
    try:
        from fbprophet import Prophet as _Prophet2
        HAVE_PROPHET = True
        PROPHET = _Prophet2
    except Exception:
        HAVE_PROPHET = False


def read_json(path: Path) -> List[Dict]:
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def to_date(dstr: str) -> datetime:
    # Accept multiple formats; try ISO first
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%b %d", "%b %d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(dstr, fmt)
        except Exception:
            continue
    # Last resort: try fromisoformat
    try:
        return datetime.fromisoformat(dstr)
    except Exception:
        # If the input date is like 'Aug 16' (no year), assume current year
        try:
            return datetime.strptime(dstr + f" {datetime.now().year}", "%b %d %Y")
        except Exception:
            raise


def forecast_series(dates: List[datetime], values: List[float], periods_ahead: int = 7) -> List[float]:
    """Return forecast for periods_ahead into the future.
    If statsmodels Holt-Winters available, use it; otherwise use naive moving average of last 7 days.
    """
    # Prefer Prophet if available
    if HAVE_PROPHET and HAVE_PANDAS:
        try:
            df = pd.DataFrame({'ds': pd.DatetimeIndex(dates), 'y': values})
            m = PROPHET()
            m.fit(df)
            future = m.make_future_dataframe(periods=periods_ahead, freq='D')
            fcst = m.predict(future)
            preds = fcst['yhat'].iloc[-periods_ahead:].tolist()
            return [float(x) for x in preds]
        except Exception:
            pass

    if HAVE_HW and HAVE_PANDAS:
        s = pd.Series(values, index=pd.DatetimeIndex(dates))
        # fit additive model without seasonality (simple)
        try:
            model = ExponentialSmoothing(s, trend='add', seasonal=None, damped_trend=False)
            fit = model.fit(optimized=True)
            pred = fit.forecast(periods_ahead)
            return [float(x) for x in pred.tolist()]
        except Exception:
            pass

    # fallback: simple average of last 7 values
    if len(values) == 0:
        return [0.0] * periods_ahead
    window = min(7, len(values))
    base = sum(values[-window:]) / window
    return [round(base, 2)] * periods_ahead


def write_forecast_to_mongo(records: List[Dict]):
    """Write the forecast records (list of dicts) to MongoDB collection `forecast`.

    Replaces the collection's documents each run so the collection contains only
    the latest 14 records.
    Uses MONGO_URI environment variable if set, otherwise connects to
    mongodb://localhost:27017 and database 'swas'.
    """
    try:
        from pymongo import MongoClient
    except Exception:
        raise RuntimeError('pymongo is not installed')

    # Load environment variables from .env file
    if load_dotenv:
        # Look for .env file in parent directory (server/)
        env_path = Path(__file__).parent.parent / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            print(f"[ENV] Loaded environment variables from: {env_path}")
        else:
            print("⚠️  No .env file found in server directory")

    mongo_uri = os.environ.get('MONGO_URI') or os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017'
    db_name = os.environ.get('MONGO_DB') or os.environ.get('MONGO_DB_NAME') or 'swas'

    client = MongoClient(mongo_uri)
    try:
        # If the connection URI includes a default database (e.g. mongodb+srv://.../swas_database),
        # prefer that database unless MONGO_DB explicit override is provided.
        db_name_env = os.environ.get('MONGO_DB') or os.environ.get('MONGO_DB_NAME')
        default_db = None
        try:
            default_db = client.get_default_database()
        except Exception:
            default_db = None

        if default_db is not None and not db_name_env:
            db_name = default_db.name
        else:
            db_name = db_name_env or (default_db.name if default_db is not None else 'swas')

        print(f'Connecting to MongoDB database "{db_name}"')

        db = client[db_name]
        coll = db['forecast']

        # Ensure we only insert the last 14 records
        limited = records[-14:]

        # Replace the collection atomically: delete and insert many
        coll.delete_many({})
        inserted = 0
        if limited:
            # Let pymongo convert date strings if needed
            res = coll.insert_many(limited)
            inserted = len(res.inserted_ids) if res and hasattr(res, 'inserted_ids') else len(limited)

        # feedback
        print(f'Wrote {inserted} forecast records to MongoDB collection "{db_name}.forecast"')
    finally:
        client.close()


def main():
    if len(sys.argv) < 2:
        print('Usage: python forecast.py path/to/daily_revenue.json')
        raise SystemExit(2)

    inp = Path(sys.argv[1])
    if not inp.exists():
        print('Input file not found:', inp)
        raise SystemExit(2)

    data = read_json(inp)
    # try to load promos/unavailability from expected output folder
    base_dir = inp.parent
    promos = []
    unavailability = []
    try:
        ppath = base_dir / 'promos.json'
        if ppath.exists():
            promos = read_json(ppath)
    except Exception:
        promos = []
    try:
        upath = base_dir / 'unavailability.json'
        if upath.exists():
            unavailability = read_json(upath)
    except Exception:
        unavailability = []
    # Build pandas DataFrame if available
    rows = []
    branches = set()
    for r in data:
        date_str = r.get('date')
        try:
            dt = to_date(date_str)
        except Exception:
            # skip bad rows
            continue
        row = {'date': dt}
        for k, v in r.items():
            if k == 'date':
                continue
            row[k] = float(v or 0.0)
            branches.add(k)
        rows.append(row)

    # sort rows by date
    rows.sort(key=lambda x: x['date'])
    dates = [r['date'] for r in rows]
    # Determine target window: 7 past days relative to today, today, 6 days future
    today = datetime.now().date()
    start = today - timedelta(days=7)
    end = today + timedelta(days=6)
    window_days = [start + timedelta(days=i) for i in range((end - start).days + 1)]

    # Prepare output list of dicts per date
    out_list = []

    # For each branch build series
    branch_series = {}
    for b in sorted(branches):
        vals = [r.get(b, 0.0) for r in rows]
        branch_series[b] = {'dates': dates, 'values': vals}

    # create quick lookup for historical dates
    date_to_index = {d.date(): idx for idx, d in enumerate(dates)}

    # For each branch, perform rolling per-day forecasts: for each target day in window,
    # train on data strictly before that day and predict that day.
    # This ensures the 6 days past and today are also predicted values.
    branch_preds: Dict[str, Dict] = {}
    for b in sorted(branches):
        vals = [r.get(b, 0.0) for r in rows]
        # build pandas DataFrame if available
        if HAVE_PANDAS:
            import pandas as _pd
            df_hist = _pd.DataFrame({'ds': _pd.DatetimeIndex(dates), 'y': vals})
        else:
            df_hist = None

        preds_by_day: Dict[datetime, float] = {}
        last_hist_date = dates[-1].date() if dates else None

        for day in window_days:
            # training data strictly before the target day
            if HAVE_PANDAS and df_hist is not None:
                df_train = df_hist[df_hist['ds'].dt.date < day]
                if len(df_train) >= 3 and HAVE_PROPHET:
                    try:
                        # If promos/unavailability exist, supply them as holidays/regressors
                        # Build holiday dataframe for Prophet
                        holidays_df = None
                        if promos or unavailability:
                            import pandas as _pd
                            hol_rows = []
                            # promos -> holiday with label PROMO
                            for pr in promos:
                                if pr.get('branch_id') != b:
                                    continue
                                for d in pr.get('promo_dates', []):
                                    try:
                                        ds = to_date(d.split(' ')[0]).date()
                                    except Exception:
                                        try:
                                            ds = to_date(d).date()
                                        except Exception:
                                            continue
                                    hol_rows.append({'ds': _pd.to_datetime(ds), 'holiday': 'promo'})
                            # unavailability full-day -> holiday 'unavail'; partial can be marked too
                            for ua in unavailability:
                                if ua.get('branch_id') != b:
                                    continue
                                try:
                                    ds = to_date(ua.get('date_unavailable')).date()
                                except Exception:
                                    continue
                                hol_rows.append({'ds': _pd.to_datetime(ds), 'holiday': 'unavailability'})
                            if hol_rows:
                                holidays_df = _pd.DataFrame(hol_rows)

                        m = PROPHET(holidays=holidays_df) if holidays_df is not None else PROPHET()
                        m.fit(df_train)
                        future = m.make_future_dataframe(periods=(day - df_train['ds'].dt.date.max()).days, freq='D')
                        # If we have holidays/regressors, ensure future frame includes them
                        if promos or unavailability:
                            # Prophet will handle holidays automatically when holidays parameter passed
                            pass
                        fcst = m.predict(future)
                        yhat = float(fcst.loc[fcst['ds'].dt.date == day, 'yhat'].iloc[0])
                        preds_by_day[day] = round(yhat, 2)
                        continue
                    except Exception:
                        pass

                if len(df_train) >= 3 and HAVE_HW:
                    try:
                        from statsmodels.tsa.holtwinters import ExponentialSmoothing as _ES
                        s = _pd.Series(df_train['y'].values, index=_pd.DatetimeIndex(df_train['ds']))
                        model = _ES(s, trend='add', seasonal=None, damped_trend=False)
                        fit = model.fit(optimized=True)
                        steps = (day - s.index[-1].date()).days
                        if steps >= 1:
                            pred = fit.forecast(steps)
                            yhat = float(pred.iloc[-1])
                        else:
                            yhat = float(s.iloc[-1])
                        preds_by_day[day] = round(yhat, 2)
                        continue
                    except Exception:
                        pass

                # fallback moving average on df_train
                if len(df_train) > 0:
                    window = min(7, len(df_train))
                    base = float(df_train['y'].iloc[-window:].mean())
                    preds_by_day[day] = round(base, 2)
                    continue
                else:
                    preds_by_day[day] = 0.0
                    continue

            # If pandas not available, use simple list-based fallback
            # Build historical list strictly before day
            hist_vals = []
            for d, r in zip(dates, rows):
                if d.date() < day:
                    hist_vals.append(r.get(b, 0.0))
            if len(hist_vals) >= 1:
                window = min(7, len(hist_vals))
                base = sum(hist_vals[-window:]) / window
                preds_by_day[day] = round(base, 2)
            else:
                preds_by_day[day] = 0.0

        branch_preds[b] = preds_by_day

    # Build output entries for each day in the window using branch_preds
    for day in window_days:
        rec = {'date': day.isoformat()}
        for b in sorted(branches):
            rec[b] = branch_preds[b].get(day, 0.0)
        # also include total per date
        rec['total'] = round(sum(rec[b] for b in sorted(branches)), 2)
        out_list.append(rec)

    outp = Path('output/forecast_output.json')
    outp.parent.mkdir(parents=True, exist_ok=True)
    with outp.open('w', encoding='utf-8') as f:
        json.dump(out_list, f, indent=2)

    print('Wrote forecast to', outp)

    # Also write the forecast to MongoDB (replace the collection each run)
    try:
        write_forecast_to_mongo(out_list)
    except Exception as e:
        print('Warning: failed to write forecast to MongoDB:', e)


if __name__ == '__main__':
    main()
