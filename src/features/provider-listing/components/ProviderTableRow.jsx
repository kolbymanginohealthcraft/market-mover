import React from 'react';
import Button from '../../../components/Buttons/Button';
import { TaggingMenu } from './TaggingMenu';
import { TagDisplay } from './TagDisplay';
import styles from './ProviderTableRow.module.css';

export const ProviderTableRow = ({
  provider,
  mainProvider,
  isInSavedMarket,
  tags,
  taggingProviderId,
  setTaggingProviderId,
  savingTagId,
  handleTag,
  handleUntag,
  isTeamProvider,
  addTeamProviders,
  removeTeamProvider,
  addingProviders,
  removingProvider,
  onRowClick
}) => {
  const isHighlighted = provider.dhc === mainProvider.dhc;

  return (
    <tr
      className={`${styles.clickableRow} ${isHighlighted ? styles.highlightedRow : ""}`}
      onClick={onRowClick}
    >
      <td>{provider.name}</td>
      <td>{provider.network || "—"}</td>
      <td>{`${provider.street}, ${provider.city}, ${provider.state} ${provider.zip}`}</td>
      <td>{provider.type || "Unknown"}</td>
      <td>{typeof provider.distance === 'number' && !isNaN(provider.distance) ? provider.distance.toFixed(2) : '—'}</td>
      <td onClick={(e) => e.stopPropagation()}>
        {isTeamProvider(provider.dhc) ? (
          <Button
            size="sm"
            variant="green"
            outline
            onClick={() => removeTeamProvider(provider.dhc)}
            disabled={removingProvider === provider.dhc}
          >
            {removingProvider === provider.dhc ? 'Removing...' : 'Remove'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="green"
            onClick={() => addTeamProviders([provider])}
            disabled={addingProviders}
          >
            {addingProviders ? 'Adding...' : 'Add'}
          </Button>
        )}
      </td>
      {isInSavedMarket && (
        <td onClick={(e) => e.stopPropagation()}>
          {provider.dhc === mainProvider.dhc ? (
            "-"
          ) : taggingProviderId === provider.dhc ? (
            <TaggingMenu
              providerDhc={provider.dhc}
              onTag={handleTag}
              onCancel={() => setTaggingProviderId(null)}
            />
          ) : (
            <TagDisplay
              tag={tags[provider.dhc]}
              providerDhc={provider.dhc}
              savingTagId={savingTagId}
              onTagClick={() => setTaggingProviderId(provider.dhc)}
              onUntag={handleUntag}
            />
          )}
        </td>
      )}
    </tr>
  );
}; 