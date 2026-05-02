import { Request, Response } from 'express';
import Setting from '../models/settings.js';
import fs from 'fs';
import path from 'path';
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

// ─── NEW: POST /api/settings/banners — Add a banner ─────────────────────────
export const addBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Banner image is required' });
      return;
    }

    const { description } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ shipping_cost: 500 });
    }

    settings.banners.push({
      image: req.file.filename,
      description: description || '',
      isVisible: true,
    } as any);

    await settings.save();

    res.status(201).json({
      message: 'Banner added successfully',
      banner: settings.banners[settings.banners.length - 1],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add banner' });
  }
};

// ─── NEW: PATCH /api/settings/banners/:bannerId/toggle — Toggle visibility ───
export const toggleBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bannerId } = req.params;

    const settings = await Setting.findOne();
    if (!settings) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }

    const banner = settings.banners.id(bannerId);
    if (!banner) {
      res.status(404).json({ error: 'Banner not found' });
      return;
    }

    banner.isVisible = !banner.isVisible;
    await settings.save();

    res.json({
      message: `Banner is now ${banner.isVisible ? 'visible' : 'hidden'}`,
      banner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle banner' });
  }
};

// ─── NEW: DELETE /api/settings/banners/:bannerId — Delete a banner ───────────
export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bannerId } = req.params;

    const settings = await Setting.findOne();
    if (!settings) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }

    const banner = settings.banners.id(bannerId);
    if (!banner) {
      res.status(404).json({ error: 'Banner not found' });
      return;
    }

    // Delete the image file from disk
    const imagePath = path.join(process.cwd(), 'uploads', banner.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    banner.deleteOne();
    await settings.save();

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
};
