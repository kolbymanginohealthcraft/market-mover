export async function ensureSingleTeamTaxonomyTag(supabaseClient, teamId, tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return [];
  }

  const sortedTags = [...tags].sort((a, b) => {
    const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
    const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  const seenCodes = new Set();
  const uniqueTags = [];
  const duplicateIds = [];

  for (const tag of sortedTags) {
    if (!tag?.taxonomy_code) {
      continue;
    }

    if (seenCodes.has(tag.taxonomy_code)) {
      if (tag.id) {
        duplicateIds.push(tag.id);
      }
      continue;
    }

    seenCodes.add(tag.taxonomy_code);
    uniqueTags.push(tag);
  }

  if (duplicateIds.length > 0 && teamId) {
    const { error } = await supabaseClient
      .from('team_taxonomy_tags')
      .delete()
      .in('id', duplicateIds);

    if (error) {
      console.error('Failed to clean up duplicate taxonomy tags', error);
    }
  }

  return uniqueTags;
}

