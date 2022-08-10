import { Button } from 'grommet';
import React, { useEffect, useState } from 'react';

export const enum MintStatus {
    unknown = 'unknown',
    loading = 'Loading...',
    can_mint = 'Mint for 0.02 ETH',
    minting = 'Minting...',
    minted = 'See your logbook',
    metabot = 'Get allowlisted',
    processing = 'Processing...',
}

const MintButton = ({ mintStatus, clickable, action = (a) => a }) => {
    const [actionLabel, setActionLabel] = useState<string>(mintStatus);

    useEffect(() => {
        setActionLabel(mintStatus);
    }, [mintStatus]);

    return (
        <div
            onMouseEnter={() => clickable && setActionLabel(`> ${mintStatus} <`)}
            onMouseLeave={() => setActionLabel(mintStatus)}
            style={{ width: '100%' }}>
            <Button
                onClick={action}
                size="large"
                primary
                disabled={!clickable}
                label={actionLabel}
                style={{ width: '100%' }}
            />
        </div>
    );
};

export default MintButton;
