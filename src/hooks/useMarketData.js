import { useEffect, useState } from "react";
import { supabase } from "../app/supabaseClient";
import { trackActivity } from "../utils/activityTracker";

export default function useMarketData(marketId, providerDhc, radiusInMiles, navigate) {
  const [currentMarketName, setCurrentMarketName] = useState("");
  const [isEditingMarket, setIsEditingMarket] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedRadius, setEditedRadius] = useState(radiusInMiles);
  const [saveMessage, setSaveMessage] = useState("");

  const isInSavedMarket = Boolean(marketId);

  // Fetch saved market info
  useEffect(() => {
    if (!marketId) return;

    const fetchMarket = async () => {
      const { data, error } = await supabase
        .from("saved_market")
        .select("name, radius_miles")
        .eq("id", marketId)
        .single();

      if (!error && data) {
        setCurrentMarketName(data.name || "");
        if (data.radius_miles) setEditedRadius(data.radius_miles);
      } else {
        console.error("❌ Error fetching saved market:", error);
      }
    };

    fetchMarket();
  }, [marketId]);

  // Save a new market
  const handleSaveMarket = async (marketName, radius, onSuccess = () => {}) => {
    setSaveMessage("Saving...");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userError || !userId) {
      setSaveMessage("Error: no user ID.");
      return;
    }

    const { data: savedMarket, error: insertError } = await supabase
      .from("saved_market")
      .insert({
        user_id: userId,
        provider_id: providerDhc,
        radius_miles: radius,
        name: marketName,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Save error:", insertError);
      setSaveMessage(`Error: ${insertError.message}`);
    } else {
      setSaveMessage("Market saved successfully!");
      
      // Track the market save activity
      await trackActivity('save_market', savedMarket.id, marketName, { radius });
      
      onSuccess(); // e.g. close popup
      redirectToCurrentTab(savedMarket.id, radius);
    }
  };

  // Edit an existing market
  const handleSaveMarketEdits = async () => {
    if (!marketId) return;

    const { error } = await supabase
      .from("saved_market")
      .update({ name: editedName, radius_miles: editedRadius })
      .eq("id", marketId);

    if (!error) {
      setCurrentMarketName(editedName);
      setIsEditingMarket(false);
      redirectToCurrentTab(marketId, editedRadius);
    } else {
      console.error("❌ Edit error:", error);
    }
  };

  const redirectToCurrentTab = (marketId, radius) => {
    const currentPath = window.location.pathname;
    const lastSegment = currentPath.split("/").pop();
    const validTabs = ["overview", "nearby", "scorecard", "charts", "matrix", "quality"];
    const subTab = validTabs.includes(lastSegment) ? lastSegment : "overview";
    navigate(`/app/provider/${providerDhc}/${subTab}?radius=${radius}&marketId=${marketId}`);
  };

  return {
    isInSavedMarket,
    currentMarketName,
    editedName,
    editedRadius,
    saveMessage,
    isEditingMarket,
    setEditedName,
    setEditedRadius,
    setIsEditingMarket,
    setSaveMessage,
    handleSaveMarket,
    handleSaveMarketEdits,
  };
}
