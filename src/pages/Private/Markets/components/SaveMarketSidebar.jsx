import Button from '../../../../components/Buttons/Button';
import SidePanel from '../../../../components/Overlays/SidePanel';

export default function SaveMarketSidebar({
  showSaveSidebar,
  setShowSaveSidebar,
  marketName,
  setMarketName,
  resolvedLocation,
  radius,
  center,
  savingMarket,
  error,
  onSaveMarket
}) {
  const handleMarketNameKeyPress = (e) => {
    if (e.key === 'Enter' && marketName.trim() && !savingMarket) {
      onSaveMarket();
    }
  };

  return (
    <SidePanel
      isOpen={showSaveSidebar}
      onClose={() => setShowSaveSidebar(false)}
      title="Save Market"
    >
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0.5rem 0' }}><strong>Location:</strong> {resolvedLocation ? `${resolvedLocation.city}, ${resolvedLocation.state}` : 'Loading location...'}</p>
          <p style={{ margin: '0.5rem 0' }}><strong>Radius:</strong> {radius} miles</p>
          <p style={{ margin: '0.5rem 0' }}><strong>Center:</strong> {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</p>
          {!resolvedLocation && (
            <p style={{ margin: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>Determining location from circle center...</p>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="marketName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Market Name
          </label>
          <input
            id="marketName"
            type="text"
            placeholder="e.g., Atlanta Metro, Dallas-Fort Worth"
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            onKeyPress={handleMarketNameKeyPress}
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
        </div>

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #f87171', 
            color: '#dc2626', 
            padding: '0.75rem', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button
            onClick={onSaveMarket}
            disabled={savingMarket || !marketName.trim()}
          >
            {savingMarket ? 'Saving...' : 'Save Market'}
          </Button>
          <Button outline onClick={() => setShowSaveSidebar(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </SidePanel>
  );
} 