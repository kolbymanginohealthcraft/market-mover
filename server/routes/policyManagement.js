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

// Get all policy definitions
router.get('/policies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('policy_definitions')
      .select('*')
      .eq('is_active', true)
      .order('nickname');

    if (error) {
      console.error('Error fetching policies:', error);
      return res.status(500).json({ error: 'Failed to load policies' });
    }

    res.json({ policies: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to load policies' });
  }
});

// Get latest approved version of a policy
router.get('/policies/:slug/latest', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data, error } = await supabase
      .rpc('get_latest_approved_policy', { policy_slug: slug });

    if (error) {
      console.error('Error fetching policy:', error);
      return res.status(500).json({ error: 'Failed to load policy' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({ policy: data[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to load policy' });
  }
});

// Get all versions of a policy
router.get('/policies/:slug/versions', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data, error } = await supabase
      .from('policy_versions')
      .select(`
        *,
        policy_definitions!inner(slug, nickname, full_name)
      `)
      .eq('policy_definitions.slug', slug)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching versions:', error);
      return res.status(500).json({ error: 'Failed to load versions' });
    }

    res.json({ versions: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to load versions' });
  }
});

// Create new policy definition (admin only)
router.post('/policies', requireAdmin, async (req, res) => {
  try {
    const { slug, nickname, full_name, description } = req.body;
    
    if (!slug || !nickname || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('policy_definitions')
      .insert({
        slug,
        nickname,
        full_name,
        description,
        created_by: req.user.id,
        updated_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating policy:', error);
      return res.status(500).json({ error: 'Failed to create policy' });
    }

    res.json({ policy: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// Create new version of a policy
router.post('/policies/:slug/versions', async (req, res) => {
  try {
    const { slug } = req.params;
    const { content, title, summary, effective_date, clone_from_version } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // If cloning from existing version, get that content
    let finalContent = content;
    if (clone_from_version) {
      const { data: existingVersion } = await supabase
        .from('policy_versions')
        .select('content')
        .eq('id', clone_from_version)
        .single();
      
      if (existingVersion) {
        finalContent = existingVersion.content;
      }
    }

    const { data, error } = await supabase
      .rpc('create_policy_version', {
        policy_slug: slug,
        content: finalContent,
        title: title || null,
        summary: summary || null,
        effective_date: effective_date || null
      });

    if (error) {
      console.error('Error creating version:', error);
      return res.status(500).json({ error: 'Failed to create version' });
    }

    res.json({ version_id: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// Update policy version (draft only)
router.put('/versions/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params;
    const { content, title, summary, effective_date } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if user can edit this version
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: version, error: fetchError } = await supabase
      .from('policy_versions')
      .select('created_by, status')
      .eq('id', versionId)
      .single();

    if (fetchError || !version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (version.created_by !== user.id && version.status !== 'draft') {
      return res.status(403).json({ error: 'Cannot edit this version' });
    }

    const { error } = await supabase
      .from('policy_versions')
      .update({
        content,
        title: title || null,
        summary: summary || null,
        effective_date: effective_date || null,
        updated_by: user.id
      })
      .eq('id', versionId)
      .eq('status', 'draft');

    if (error) {
      console.error('Error updating version:', error);
      return res.status(500).json({ error: 'Failed to update version' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update version' });
  }
});

// Submit version for approval
router.post('/versions/:versionId/submit', async (req, res) => {
  try {
    const { versionId } = req.params;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('policy_versions')
      .update({
        status: 'pending_approval',
        updated_by: user.id
      })
      .eq('id', versionId)
      .eq('created_by', user.id)
      .eq('status', 'draft');

    if (error) {
      console.error('Error submitting version:', error);
      return res.status(500).json({ error: 'Failed to submit version' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to submit version' });
  }
});

// Approve/reject version (admin only)
router.post('/versions/:versionId/approve', requireAdmin, async (req, res) => {
  try {
    const { versionId } = req.params;
    const { action, comments } = req.body; // 'approve' or 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (action === 'approve') {
      const { data, error } = await supabase
        .rpc('approve_policy_version', { version_id: parseInt(versionId) });

      if (error) {
        console.error('Error approving version:', error);
        return res.status(500).json({ error: 'Failed to approve version' });
      }
    } else {
      // Reject version
      const { error } = await supabase
        .from('policy_versions')
        .update({
          status: 'rejected',
          rejection_reason: comments,
          updated_by: req.user.id
        })
        .eq('id', versionId);

      if (error) {
        console.error('Error rejecting version:', error);
        return res.status(500).json({ error: 'Failed to reject version' });
      }

      // Add rejection record
      await supabase
        .from('policy_approvals')
        .insert({
          version_id: parseInt(versionId),
          approver_id: req.user.id,
          action: 'reject',
          comments
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

// Get pending approvals (admin only)
router.get('/approvals/pending', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('policy_versions')
      .select(`
        *,
        policy_definitions(slug, nickname, full_name),
        profiles!policy_versions_created_by_fkey(email)
      `)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending approvals:', error);
      return res.status(500).json({ error: 'Failed to load approvals' });
    }

    res.json({ approvals: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to load approvals' });
  }
});

// Get user's drafts
router.get('/drafts', async (req, res) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('policy_versions')
      .select(`
        *,
        policy_definitions(slug, nickname, full_name)
      `)
      .eq('created_by', user.id)
      .in('status', ['draft', 'pending_approval', 'rejected'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drafts:', error);
      return res.status(500).json({ error: 'Failed to load drafts' });
    }

    res.json({ drafts: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to load drafts' });
  }
});

export default router; 