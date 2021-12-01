import { useEffect } from 'react';

import { Viewer } from '@utils/viewer';

const wrapStyles = {
    display: 'flex',
    width: '100vw',
    flexGrow: 1,
};

const sceneStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '800px',
    height: '800px',
};

function ViewerPage() {
    useEffect(() => {
        let el = document.body;
        let spinnerEl = el.querySelector('.spinner');
        let sceneEl = el.querySelector('.scene');
        let viewerEl = document.createElement('div');
        viewerEl.classList.add('viewer');
        sceneEl.innerHTML = '';
        sceneEl.appendChild(viewerEl);
        const options = {};
        let viewer = new Viewer(viewerEl, options);
        viewer.load('Hydrangea');
    }, []);

    return (
        <div>
            <h1>Viewer</h1>
            <main className="wrap" style={wrapStyles}>
                <div className="scene" style={sceneStyles}></div>
                <div className="spinner"></div>
            </main>
        </div>
    );
}

export default ViewerPage;
