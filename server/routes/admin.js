import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get legal content
router.get('/legal-content/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['terms', 'privacy', 'refund'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const { data, error } = await supabase
      .from('legal_content')
      .select('content')
      .eq('content_type', type)
      .single();

    if (error) {
      console.error('Error fetching legal content:', error);
      return res.status(500).json({ error: 'Failed to load content' });
    }

    res.json({ content: data?.content || '' });
  } catch (error) {
    console.error('Error reading legal content:', error);
    res.status(500).json({ error: 'Failed to read content' });
  }
});

// Update legal content
router.put('/legal-content/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { content } = req.body;
    
    const validTypes = ['terms', 'privacy', 'refund'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Update content in database
    const { error } = await supabase
      .from('legal_content')
      .update({ 
        content,
        updated_by: req.user.id,
        version: supabase.sql`version + 1`
      })
      .eq('content_type', type);

    if (error) {
      console.error('Error updating legal content:', error);
      return res.status(500).json({ error: 'Failed to save content' });
    }
    
    res.json({ success: true, message: 'Content saved successfully' });
  } catch (error) {
    console.error('Error writing legal content:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Get legal content history (optional - for version tracking)
router.get('/legal-content/:type/history', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['terms', 'privacy', 'refund'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const { data, error } = await supabase
      .from('legal_content')
      .select('content, version, updated_at, updated_by')
      .eq('content_type', type)
      .single();

    if (error) {
      console.error('Error fetching legal content history:', error);
      return res.status(500).json({ error: 'Failed to load history' });
    }

    res.json({ 
      content: data?.content || '',
      version: data?.version || 1,
      updated_at: data?.updated_at,
      updated_by: data?.updated_by
    });
  } catch (error) {
    console.error('Error reading legal content history:', error);
    res.status(500).json({ error: 'Failed to read history' });
  }
});

export default router; 