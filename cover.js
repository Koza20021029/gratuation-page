document.addEventListener('DOMContentLoaded', () => {
    function spawnLeaf() {
        const layer = document.querySelector('.leaves-layer');
        if (!layer) return;
        const leaf = document.createElement('div');
        leaf.className = 'leaf-particle';
        leaf.innerHTML = `<div style="transform: scale(${Math.random() * 2.5 + 0.5})">
            <svg style="filter: drop-shadow(0 0 5px rgba(255,255,255,0.2));" viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)" width="24" height="24"><path d="M17,8C8,10 5.5,13.5 5.5,17C5.5,17 7.5,14 11.5,13.5C11.5,13.5 12,18 12,18C12,18 13.5,12.5 17,8Z"/></svg>
        </div>`;
        const duration = Math.random() * 5 + 5;
        leaf.style.left = `${Math.random() * 100}vw`;
        leaf.style.animationDuration = `${duration}s`;
        layer.appendChild(leaf);
        setTimeout(() => { if(leaf.parentNode) leaf.parentNode.removeChild(leaf); }, duration * 1000);
    }

    function spawnFish() {
        const layer = document.querySelector('.fishes-layer');
        if (!layer) return;
        const fish = document.createElement('div');
        fish.className = 'fish-particle';
        const isReverse = Math.random() > 0.5;
        fish.innerHTML = `<div style="transform: scale(${Math.random() * 2 + 0.8}) ${isReverse ? 'scaleX(-1)' : ''}">
            <svg style="filter: drop-shadow(0 0 8px rgba(255,255,255,0.2));" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)" width="40" height="20"><path d="M2 12C2 12 7 7 12 12C17 17 22 12 22 12C22 12 17 9 12 12C7 15 2 12 2 12ZM4 12L1 10V14L4 12Z"/></svg>
        </div>`;
        const duration = Math.random() * 8 + 7;
        fish.style.top = `${Math.random() * 60 + 20}vh`;
        fish.style.animationDuration = `${duration}s`;
        if (isReverse) {
            fish.style.left = '110vw';
            fish.style.animationName = 'swimAcrossReverse';
        }
        layer.appendChild(fish);
        setTimeout(() => { if(fish.parentNode) fish.parentNode.removeChild(fish); }, duration * 1000);
    }

    const isMobile = window.innerWidth <= 768;
    setInterval(spawnLeaf, isMobile ? 3000 : 800);
    setInterval(spawnFish, isMobile ? 6000 : 2000);
});
