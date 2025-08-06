import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useTeamCustomColors() {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingColor, setAddingColor] = useState(false);
  const [updatingColor, setUpdatingColor] = useState(false);
  const [deletingColor, setDeletingColor] = useState(false);

  // Fetch team custom colors
  const fetchTeamColors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get user's team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        setError('User not part of a team');
        setLoading(false);
        return;
      }

      // Fetch team custom colors
      const { data: teamColors, error: colorsError } = await supabase
        .from('team_custom_colors')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('color_order', { ascending: true });

      if (colorsError) {
        setError('Failed to fetch team colors');
        console.error('Error fetching team colors:', colorsError);
      } else {
        setColors(teamColors || []);
      }
    } catch (err) {
      setError('Unexpected error fetching team colors');
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new custom color
  const addTeamColor = async (colorName, colorHex) => {
    setAddingColor(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Get user's team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        setError('User not part of a team');
        return;
      }

      // Get the next order number
      const nextOrder = colors.length;

      const { data: newColor, error: insertError } = await supabase
        .from('team_custom_colors')
        .insert({
          team_id: profile.team_id,
          color_name: colorName,
          color_hex: colorHex,
          color_order: nextOrder
        })
        .select()
        .single();

      if (insertError) {
        setError('Failed to add color');
        console.error('Error adding color:', insertError);
      } else {
        setColors(prev => [...prev, newColor]);
      }
    } catch (err) {
      setError('Unexpected error adding color');
      console.error('Unexpected error:', err);
    } finally {
      setAddingColor(false);
    }
  };

  // Update an existing custom color
  const updateTeamColor = async (colorId, updates) => {
    setUpdatingColor(true);
    setError(null);
    
    try {
      const { data: updatedColor, error: updateError } = await supabase
        .from('team_custom_colors')
        .update(updates)
        .eq('id', colorId)
        .select()
        .single();

      if (updateError) {
        setError('Failed to update color');
        console.error('Error updating color:', updateError);
      } else {
        setColors(prev => prev.map(color => 
          color.id === colorId ? updatedColor : color
        ));
      }
    } catch (err) {
      setError('Unexpected error updating color');
      console.error('Unexpected error:', err);
    } finally {
      setUpdatingColor(false);
    }
  };

  // Delete a custom color
  const deleteTeamColor = async (colorId) => {
    setDeletingColor(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('team_custom_colors')
        .delete()
        .eq('id', colorId);

      if (deleteError) {
        setError('Failed to delete color');
        console.error('Error deleting color:', deleteError);
      } else {
        setColors(prev => prev.filter(color => color.id !== colorId));
      }
    } catch (err) {
      setError('Unexpected error deleting color');
      console.error('Unexpected error:', err);
    } finally {
      setDeletingColor(false);
    }
  };

  // Reorder colors
  const reorderColors = async (colorIds) => {
    setUpdatingColor(true);
    setError(null);
    
    try {
      // Update each color with its new order
      const updatePromises = colorIds.map((colorId, index) => 
        supabase
          .from('team_custom_colors')
          .update({ color_order: index })
          .eq('id', colorId)
      );

      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        setError('Failed to reorder colors');
        console.error('Error reordering colors:', results);
      } else {
        // Refresh colors to get the new order
        await fetchTeamColors();
      }
    } catch (err) {
      setError('Unexpected error reordering colors');
      console.error('Unexpected error:', err);
    } finally {
      setUpdatingColor(false);
    }
  };

  // Get a color by name
  const getColorByName = (colorName) => {
    return colors.find(color => color.color_name === colorName);
  };

  // Get a color by hex value
  const getColorByHex = (colorHex) => {
    return colors.find(color => color.color_hex.toLowerCase() === colorHex.toLowerCase());
  };

  // Get colors as an array of hex values
  const getColorHexArray = () => {
    return colors.map(color => color.color_hex);
  };

  // Initialize on mount
  useEffect(() => {
    fetchTeamColors();
  }, []);

  return {
    colors,
    loading,
    error,
    addingColor,
    updatingColor,
    deletingColor,
    fetchTeamColors,
    addTeamColor,
    updateTeamColor,
    deleteTeamColor,
    reorderColors,
    getColorByName,
    getColorByHex,
    getColorHexArray
  };
} 