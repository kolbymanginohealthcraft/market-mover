import { supabase } from '../app/supabaseClient';

// Get all plans with current pricing and features
export async function getPlans(priceBookName = 'standard') {
  try {
    // Get the price book ID
    const { data: priceBook, error: priceBookError } = await supabase
      .from('price_books')
      .select('id')
      .eq('name', priceBookName)
      .eq('is_active', true)
      .single();

    if (priceBookError || !priceBook) {
      throw new Error(`Price book '${priceBookName}' not found`);
    }

    // Get plans with current pricing
    const { data: plans, error } = await supabase
      .from('plans')
      .select(`
        *,
        plan_pricing!inner(
          price_monthly,
          license_block_price,
          effective_date
        ),
        plan_features(
          features(
            name,
            description
          )
        )
      `)
      .eq('plan_pricing.price_book_id', priceBook.id)
      .is('plan_pricing.end_date', null) // Current pricing only
      .eq('is_active', true);

    if (error) throw error;

    // Transform the data to match the expected format and sort by price
    return plans
      .map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        max_users: plan.max_users,
        price_monthly: plan.plan_pricing[0]?.price_monthly,
        license_block_price: plan.plan_pricing[0]?.license_block_price || 250,
        features: plan.plan_features.map(pf => pf.features.name),
        badge: plan.name === 'Advanced' ? 'Most Popular' : null
      }))
      .sort((a, b) => (a.price_monthly || 0) - (b.price_monthly || 0));
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
}

// Get plan by ID with current pricing
export async function getPlanById(planId, priceBookName = 'standard') {
  try {
    const { data: priceBook } = await supabase
      .from('price_books')
      .select('id')
      .eq('name', priceBookName)
      .eq('is_active', true)
      .single();

    const { data: plan, error } = await supabase
      .from('plans')
      .select(`
        *,
        plan_pricing!inner(
          price_monthly,
          license_block_price,
          effective_date
        ),
        plan_features(
          features(
            name,
            description
          )
        )
      `)
      .eq('id', planId)
      .eq('plan_pricing.price_book_id', priceBook.id)
      .is('plan_pricing.end_date', null)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      max_users: plan.max_users,
      price_monthly: plan.plan_pricing[0]?.price_monthly,
      license_block_price: plan.plan_pricing[0]?.license_block_price || 250,
      features: plan.plan_features.map(pf => pf.features.name)
    };
  } catch (error) {
    console.error('Error fetching plan:', error);
    throw error;
  }
}

// Get pricing history for a plan
export async function getPlanPricingHistory(planId, priceBookName = 'standard') {
  try {
    const { data: priceBook } = await supabase
      .from('price_books')
      .select('id')
      .eq('name', priceBookName)
      .single();

    const { data: pricingHistory, error } = await supabase
      .from('plan_pricing')
      .select('*')
      .eq('plan_id', planId)
      .eq('price_book_id', priceBook.id)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return pricingHistory;
  } catch (error) {
    console.error('Error fetching pricing history:', error);
    throw error;
  }
}

// Update plan pricing (creates new pricing record)
export async function updatePlanPricing(planId, priceBookName, newPricing) {
  try {
    const { data: priceBook } = await supabase
      .from('price_books')
      .select('id')
      .eq('name', priceBookName)
      .single();

    // End the current pricing
    await supabase
      .from('plan_pricing')
      .update({ end_date: new Date().toISOString() })
      .eq('plan_id', planId)
      .eq('price_book_id', priceBook.id)
      .is('end_date', null);

    // Create new pricing record
    const { data, error } = await supabase
      .from('plan_pricing')
      .insert({
        plan_id: planId,
        price_book_id: priceBook.id,
        price_monthly: newPricing.price_monthly,
        license_block_price: newPricing.license_block_price || 250,
        effective_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating plan pricing:', error);
    throw error;
  }
}


