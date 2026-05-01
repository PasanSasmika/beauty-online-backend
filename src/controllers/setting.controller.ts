import { Request, Response } from 'express';
import Setting from '../models/settings.js';

// GET: Fetch global settings
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // We only want ONE settings document in the entire database
    let settings = await Setting.findOne();
    
    // If it doesn't exist yet, create it with the default values
    if (!settings) {
      settings = await Setting.create({ shipping_cost: 500 });
    }
    
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// PUT: Update global settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shipping_cost } = req.body;

    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = await Setting.create({ shipping_cost });
    } else {
      settings.shipping_cost = shipping_cost;
      await settings.save();
    }

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};