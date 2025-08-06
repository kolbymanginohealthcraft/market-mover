import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Buttons/Button';
import { ProviderTableRow } from './ProviderTableRow';
import { useTeamProviders } from '../../../hooks/useTeamProviders';
import styles from './ProviderListingTable.module.css';

export const ProviderListingTable = ({
  filteredResults,
  provider,
  isInSavedMarket,
  tags,
  taggingProviderId,
  setTaggingProviderId,
  savingTagId,
  handleTag,
  handleUntag,
  ccnProviderIds
}) => {
  const navigate = useNavigate();
  
  // Team providers functionality
  const {
    isTeamProvider,
    addTeamProviders,
    removeTeamProvider,
    addingProviders,
    removingProvider
  } = useTeamProviders();

  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Network</th>
            <th>Address</th>
            <th>Type</th>
            <th>Distance</th>
            <th>My Providers</th>
            {isInSavedMarket && <th>Tag</th>}
          </tr>
        </thead>
        <tbody>
          {filteredResults.map((p) => (
            <ProviderTableRow
              key={p.dhc}
              provider={p}
              mainProvider={provider}
              isInSavedMarket={isInSavedMarket}
              tags={tags}
              taggingProviderId={taggingProviderId}
              setTaggingProviderId={setTaggingProviderId}
              savingTagId={savingTagId}
              handleTag={handleTag}
              handleUntag={handleUntag}
              isTeamProvider={isTeamProvider}
              addTeamProviders={addTeamProviders}
              removeTeamProvider={removeTeamProvider}
              addingProviders={addingProviders}
              removingProvider={removingProvider}
              onRowClick={() => navigate(`/app/provider/${p.dhc}/overview`)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}; 