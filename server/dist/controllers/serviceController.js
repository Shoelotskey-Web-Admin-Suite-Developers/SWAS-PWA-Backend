"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addService = exports.getServiceById = exports.getAllServices = void 0;
const Service_1 = require("../models/Service");
// Get all services
const getAllServices = async (req, res) => {
    try {
        const services = await Service_1.Service.find().sort({ service_id: 1 }); // Sort alphabetically
        const formattedServices = services.map((s) => ({
            _id: s._id,
            service_id: s.service_id,
            service_name: s.service_name,
            service_type: s.service_type,
            service_base_price: s.service_base_price,
            service_duration: s.service_duration,
            service_description: s.service_description,
        }));
        return res.status(200).json({ services: formattedServices });
    }
    catch (err) {
        console.error("Error fetching services:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getAllServices = getAllServices;
// Get single service by service_id (e.g., SERVICE-1)
const getServiceById = async (req, res) => {
    try {
        const { serviceId } = req.params;
        if (!serviceId)
            return res.status(400).json({ error: 'serviceId param is required' });
        const service = await Service_1.Service.findOne({ service_id: serviceId });
        if (!service)
            return res.status(404).json({ error: 'Service not found' });
        return res.status(200).json({
            service: {
                _id: service._id,
                service_id: service.service_id,
                service_name: service.service_name,
                service_type: service.service_type,
                service_base_price: service.service_base_price,
                service_duration: service.service_duration,
                service_description: service.service_description,
            },
        });
    }
    catch (err) {
        console.error('Error fetching service by id:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};
exports.getServiceById = getServiceById;
// Add a new service
const addService = async (req, res) => {
    try {
        const { service_name, service_type, service_base_price, service_duration, service_description } = req.body;
        if (!service_name ||
            !service_type ||
            service_base_price === undefined ||
            service_duration === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // Generate service_id (like SERVICE-1, SERVICE-2)
        const lastService = await Service_1.Service.findOne().sort({ _id: -1 });
        const nextIdNumber = lastService
            ? parseInt(lastService.service_id.replace("SERVICE-", ""), 10) + 1
            : 1;
        const service_id = `SERVICE-${nextIdNumber}`;
        const newService = new Service_1.Service({
            service_id,
            service_name,
            service_type,
            service_base_price,
            service_duration,
            service_description: service_description || null,
        });
        const savedService = await newService.save();
        return res.status(201).json({
            service: {
                _id: savedService._id,
                service_id: savedService.service_id,
                service_name: savedService.service_name,
                service_type: savedService.service_type,
                service_base_price: savedService.service_base_price,
                service_duration: savedService.service_duration,
                service_description: savedService.service_description,
            },
        });
    }
    catch (err) {
        console.error("Error adding service:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.addService = addService;
