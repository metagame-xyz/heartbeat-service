import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from 'grommet';
import { Down } from 'grommet-icons';
import React, { useState } from 'react';

const CustomConnectButton = () => {
    const [connectLabel, setConnectLabel] = useState('Connect wallet');
    const [displayName, setDisplayName] = useState('');
    return (
        <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                return (
                    <div
                        {...(!mounted && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                        style={{ width: '100%' }}>
                        {(() => {
                            if (!mounted || !account || !chain) {
                                return (
                                    <div
                                        onMouseEnter={() => setConnectLabel('> Connect Wallet <')}
                                        onMouseLeave={() => setConnectLabel('Connect Wallet')}
                                        style={{ width: '100%' }}>
                                        <Button
                                            onClick={openConnectModal}
                                            primary
                                            size="large"
                                            label={connectLabel}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                );
                            }

                            if (chain.unsupported) {
                                return <Button onClick={openChainModal}>Wrong network</Button>;
                            }

                            return (
                                <div
                                    style={{ display: 'flex', gap: 12 }}
                                    onMouseEnter={() =>
                                        setDisplayName(`> ${account.displayName} <`)
                                    }
                                    onMouseLeave={() => setDisplayName(account.displayName)}>
                                    <Button
                                        secondary
                                        onClick={openAccountModal}
                                        style={{ width: '100%' }}
                                        label={displayName || account.displayName}
                                        size="small"
                                    />
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};

export default CustomConnectButton;
