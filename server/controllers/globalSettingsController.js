import GlobalSettings from '../models/GlobalSettings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current settings
export const getSettings = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne();

        // If no settings exist, create default
        if (!settings) {
            settings = await GlobalSettings.create({
                nama_pt: 'Institut Teknologi dan Kesehatan Mahardika',
                default_lms_name: 'SIBEDA',
                default_lms_url: 'sibeda.mahardika.ac.id'
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching global settings:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

// Update settings
export const updateSettings = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne();

        if (!settings) {
            settings = new GlobalSettings();
        }

        // Update fields
        const { nama_pt, default_lms_name, default_lms_url, alamat_pt, kode_pt, website, social_media } = req.body;

        if (nama_pt) settings.nama_pt = nama_pt;
        if (default_lms_name) settings.default_lms_name = default_lms_name;
        if (default_lms_url) settings.default_lms_url = default_lms_url;
        if (alamat_pt) settings.alamat_pt = alamat_pt;
        if (kode_pt) settings.kode_pt = kode_pt;
        if (website) settings.website = website;
        if (social_media) {
            try {
                settings.social_media = typeof social_media === 'string' ? JSON.parse(social_media) : social_media;
            } catch (e) {
                console.error('Error parsing social media JSON:', e);
                settings.social_media = {};
            }
        }

        if (req.body.color_palette) {
            try {
                settings.color_palette = typeof req.body.color_palette === 'string' ? JSON.parse(req.body.color_palette) : req.body.color_palette;
            } catch (e) {
                console.error('Error parsing color palette JSON:', e);
            }
        }

        // Handle file uploads and deletions
        if (req.files) {
            console.log('Files received:', Object.keys(req.files));
            if (req.files.logo) {
                console.log('Processing logo:', req.files.logo[0].filename);
                if (settings.logo_path) {
                    const oldPath = path.join(__dirname, '../', settings.logo_path);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                settings.logo_path = 'uploads/settings/' + req.files.logo[0].filename;
                settings.logo_filename = req.files.logo[0].originalname;
            }

            if (req.files.favicon) {
                console.log('Processing favicon:', req.files.favicon[0].filename);
                if (settings.favicon_path) {
                    const oldPath = path.join(__dirname, '../', settings.favicon_path);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                settings.favicon_path = 'uploads/settings/' + req.files.favicon[0].filename;
                settings.favicon_filename = req.files.favicon[0].originalname;
            }

            if (req.files.kop_surat) {
                console.log('Processing kop surat:', req.files.kop_surat[0].filename);
                if (settings.kop_surat_path) {
                    const oldPath = path.join(__dirname, '../', settings.kop_surat_path);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                settings.kop_surat_path = 'uploads/settings/' + req.files.kop_surat[0].filename;
                settings.kop_surat_filename = req.files.kop_surat[0].originalname;
            }
        }

        // Handle explicit deletions
        if (req.body.remove_logo === 'true' && !req.files?.logo) {
            if (settings.logo_path) {
                const oldPath = path.join(__dirname, '../', settings.logo_path);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            settings.logo_path = null;
            settings.logo_filename = null;
        }

        if (req.body.remove_favicon === 'true' && !req.files?.favicon) {
            if (settings.favicon_path) {
                const oldPath = path.join(__dirname, '../', settings.favicon_path);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            settings.favicon_path = null;
            settings.favicon_filename = null;
        }

        if (req.body.remove_kop_surat === 'true' && !req.files?.kop_surat) {
            if (settings.kop_surat_path) {
                const oldPath = path.join(__dirname, '../', settings.kop_surat_path);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            settings.kop_surat_path = null;
            settings.kop_surat_filename = null;
        }

        await settings.save();

        res.json({
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating global settings:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
};
