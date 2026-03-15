class PlayerSphere {
    constructor(canvasId, size = 80) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.size = size;
        this.canvas.width = size * 2.5;
        this.canvas.height = size * 2.5;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = size * 0.375; // 75% of half size
        
        this.animationFrame = null;
        this.shouldAnimate = false;
        
        // Preload wing imagenice
        this.wingImage = new Image();
        this.wingImage.src = 'media/darkwing.png';
        this.wingImageLoaded = false;
        this.wingImage.onload = () => {
            this.wingImageLoaded = true;
            if (this.shouldAnimate) {
                this.draw(this.cosmetics);
            }
        };
    }
    
draw(cosmetics = {}) {
    const { color = 'default', hat = 'none', face = 'none', effect = 'none', sword = 'none' } = cosmetics;
        
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (effect === 'blackhole' || effect === 'wings' || effect === 'mystical-aura' || effect === 'golden-aura' || effect === 'champion-aura' || effect === 'voidstorm-aura' || effect === 'neon-crown-aura' || effect === 'solar-flare-aura') {
        this.drawEffect(effect);
    }
    
    this.drawSphere(color);
    this.drawSword(sword);
    this.drawFace(face);
    this.drawHat(hat);
}
    
    drawSphere(color) {
        const gradient = this.ctx.createRadialGradient(
            this.centerX - this.radius * 0.33,
            this.centerY - this.radius * 0.33,
            this.radius * 0.16,
            this.centerX,
            this.centerY,
            this.radius
        );
        
switch(color) {
    case 'sunset':
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ff9a3c');
        break;
    case 'ocean':
        gradient.addColorStop(0, '#4cc9f0');
        gradient.addColorStop(1, '#0077b6');
        break;
    case 'galaxy':
        gradient.addColorStop(0, '#c77dff');
        gradient.addColorStop(1, '#3c096c');
        break;
    case 'blood':
        gradient.addColorStop(0, '#ff1a1a');
        gradient.addColorStop(1, '#660000');
        break;
    case 'quartz':
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#f0f0f0');
        gradient.addColorStop(1, '#b8b8b8');
        break;
    case 'ruby':
        gradient.addColorStop(0, '#ff0844');
        gradient.addColorStop(0.5, '#8b0020');
        gradient.addColorStop(1, '#000000');
        break;
    case 'obsidian':
        gradient.addColorStop(0, '#8b7355');
        gradient.addColorStop(0.4, '#1a1410');
        gradient.addColorStop(1, '#000000');
        break;
    case 'opaline':
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, '#a8a8a8');
        gradient.addColorStop(1, '#1a1a1a');
        break;
    default:
        gradient.addColorStop(0, '#888');
        gradient.addColorStop(1, '#333');
}
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFace(face) {
        const eyeSize = this.radius * 0.1;
        const eyeY = this.centerY - this.radius * 0.26;
        const eyeOffsetX = this.radius * 0.33;
        const mouthRadius = this.radius * 0.5;
        
        if (face === 'happy') {
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(this.centerX - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(this.centerX + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, mouthRadius, 0, Math.PI);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = this.radius * 0.066;
            this.ctx.stroke();
            
        } else if (face === 'evil') {
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(this.centerX - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(this.centerX + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY + this.radius * 0.33, mouthRadius, Math.PI, 0);
            this.ctx.strokeStyle = '#f00';
            this.ctx.lineWidth = this.radius * 0.066;
            this.ctx.stroke();
            
        } else if (face === 'cool') {
            this.ctx.fillStyle = '#000';
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = this.radius * 0.04;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX - eyeOffsetX, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(this.centerX + eyeOffsetX, eyeY, eyeSize * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = this.radius * 0.06;
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX - eyeOffsetX + eyeSize * 1.5, eyeY);
            this.ctx.lineTo(this.centerX + eyeOffsetX - eyeSize * 1.5, eyeY);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = this.radius * 0.05;
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX - this.radius * 0.3, this.centerY + this.radius * 0.2);
            this.ctx.quadraticCurveTo(
                this.centerX, this.centerY + this.radius * 0.35,
                this.centerX + this.radius * 0.2, this.centerY + this.radius * 0.25
            );
            this.ctx.stroke();
        }
    }
    
    drawHat(hat) {
        const scale = this.radius / 30;
        
        if (hat === 'crown') {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.beginPath();
            
            const points = [
                [this.centerX - this.radius * 0.66, this.centerY - this.radius * 0.83],
                [this.centerX - this.radius * 0.5, this.centerY - this.radius * 1.06],
                [this.centerX - this.radius * 0.25, this.centerY - this.radius * 0.93],
                [this.centerX - this.radius * 0.033, this.centerY - this.radius * 1.13],
                [this.centerX, this.centerY - this.radius * 0.93],
                [this.centerX + this.radius * 0.17, this.centerY - this.radius * 1.06],
                [this.centerX + this.radius * 0.33, this.centerY - this.radius * 0.93],
                [this.centerX + this.radius * 0.5, this.centerY - this.radius * 1.06],
                [this.centerX + this.radius * 0.66, this.centerY - this.radius * 0.83]
            ];
            
            this.ctx.moveTo(points[0][0], points[0][1]);
            points.forEach(p => this.ctx.lineTo(p[0], p[1]));
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY - this.radius * 0.96, this.radius * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (hat === 'tophat') {
            this.ctx.fillStyle = '#000';
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = this.radius * 0.06;
            this.ctx.fillRect(
                this.centerX - this.radius * 0.5,
                this.centerY - this.radius * 1.16,
                this.radius,
                this.radius * 0.26
            );
            this.ctx.strokeRect(
                this.centerX - this.radius * 0.5,
                this.centerY - this.radius * 1.16,
                this.radius,
                this.radius * 0.26
            );
            this.ctx.fillRect(
                this.centerX - this.radius * 0.66,
                this.centerY - this.radius * 0.9,
                this.radius * 1.33,
                this.radius * 0.16
            );
            this.ctx.strokeRect(
                this.centerX - this.radius * 0.66,
                this.centerY - this.radius * 0.9,
                this.radius * 1.33,
                this.radius * 0.16
            );
            
        } else if (hat === 'wizard') {
            this.ctx.fillStyle = '#6b46c1';
            this.ctx.strokeStyle = '#a855f7';
            this.ctx.lineWidth = this.radius * 0.05;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY - this.radius * 1.16);
            this.ctx.lineTo(this.centerX - this.radius * 0.5, this.centerY - this.radius * 0.83);
            this.ctx.lineTo(this.centerX + this.radius * 0.5, this.centerY - this.radius * 0.83);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = `${this.radius * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('★', this.centerX, this.centerY - this.radius * 0.93);        
            
        } else if (hat === 'santa') {
            this.ctx.fillStyle = '#dc143c';
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY - this.radius * 1.5); // Higher tip
            this.ctx.lineTo(this.centerX - this.radius * 0.5, this.centerY - this.radius * 0.9); // Higher base
            this.ctx.lineTo(this.centerX + this.radius * 0.4, this.centerY - this.radius * 0.9);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(this.centerX - this.radius * 0.5, this.centerY - this.radius * 0.95, this.radius * 0.9, this.radius * 0.15);
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY - this.radius * 1.5, this.radius * 0.15, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (hat === 'party') {
            const gradient = this.ctx.createLinearGradient(
                this.centerX - this.radius * 0.4,
                this.centerY - this.radius * 1.6, // Higher
                this.centerX + this.radius * 0.4,
                this.centerY - this.radius * 0.9
            );
            gradient.addColorStop(0, '#ff0080');
            gradient.addColorStop(0.5, '#00ff80');
            gradient.addColorStop(1, '#0080ff');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY - this.radius * 1.6); // Higher tip
            this.ctx.lineTo(this.centerX - this.radius * 0.45, this.centerY - this.radius * 0.9); // Higher base
            this.ctx.lineTo(this.centerX + this.radius * 0.45, this.centerY - this.radius * 0.9);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY - this.radius * 1.6, this.radius * 0.12, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawEffect(effect) {
        if (effect === 'mystical-aura') {
            const time = Date.now() / 1000;
            const pulseSize = this.radius * (1.4 + Math.sin(time * 2) * 0.1);
            
            // Outer glow
            const gradient1 = this.ctx.createRadialGradient(
                this.centerX, this.centerY, this.radius * 0.9,
                this.centerX, this.centerY, pulseSize
            );
            gradient1.addColorStop(0, 'rgba(0, 140, 153, 0.3)');
            gradient1.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient1;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Sparkles
            for (let i = 0; i < 6; i++) {
                const angle = time + (i * Math.PI / 3);
                const distance = this.radius * 1.3;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                const sparkleSize = this.radius * 0.08;
                
                this.ctx.fillStyle = '#00d9ff';
                this.ctx.beginPath();
                this.ctx.arc(x, y, sparkleSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            } else if (effect === 'golden-aura') {
            const time = Date.now() / 1000;
            
            // Golden glow
            const pulseSize = this.radius * (1.5 + Math.sin(time * 3) * 0.15);
            const gradient = this.ctx.createRadialGradient(
                this.centerX, this.centerY, this.radius * 0.8,
                this.centerX, this.centerY, pulseSize
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Orbiting coin symbols
            for (let i = 0; i < 8; i++) {
                const angle = (time * 1.5) + (i * Math.PI / 4);
                const distance = this.radius * 1.4;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(time * 2);
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = `${this.radius * 0.25}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('💰', 0, 0);
                this.ctx.restore();
            }

        } else if (effect === 'champion-aura') {
            const time = Date.now() / 1000;
            const pulseSize = this.radius * (1.65 + Math.sin(time * 3.5) * 0.14);
            const gradient = this.ctx.createRadialGradient(
                this.centerX, this.centerY, this.radius * 0.7,
                this.centerX, this.centerY, pulseSize
            );
            gradient.addColorStop(0, 'rgba(255, 110, 0, 0.45)');
            gradient.addColorStop(0.45, 'rgba(122, 0, 255, 0.25)');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();

            for (let i = 0; i < 10; i++) {
                const angle = (time * 2.2) + (i * Math.PI / 5);
                const distance = this.radius * 1.55;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;

                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(time * 3);
                this.ctx.fillStyle = i % 2 === 0 ? '#ff9d00' : '#8a4dff';
                this.ctx.font = `${this.radius * 0.24}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('✦', 0, 0);
                this.ctx.restore();
            }

       } else if (effect === 'voidstorm-aura') {
    const t = Date.now() / 1000;
    const cx = this.centerX, cy = this.centerY, r = this.radius;

    // Void backdrop
    const voidR = r * (2.0 + Math.sin(t * 1.8) * 0.15);
    const voidG = this.ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, voidR);
    voidG.addColorStop(0, 'rgba(10, 0, 30, 0.7)');
    voidG.addColorStop(0.45, 'rgba(55, 0, 120, 0.25)');
    voidG.addColorStop(0.75, 'rgba(0, 200, 255, 0.06)');
    voidG.addColorStop(1, 'transparent');
    this.ctx.fillStyle = voidG;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, voidR, 0, Math.PI * 2);
    this.ctx.fill();

    // Rift crack lines
    for (let i = 0; i < 7; i++) {
        const baseAngle = (i / 7) * Math.PI * 2 + t * 0.3;
        const len = r * (1.15 + Math.sin(t * 2.1 + i * 1.3) * 0.25);
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(baseAngle);
        const opacity = 0.5 + Math.sin(t * 3.5 + i) * 0.3;
        this.ctx.strokeStyle = `rgba(180, 80, 255, ${opacity})`;
        this.ctx.lineWidth = 1.2;
        this.ctx.shadowColor = '#a855f7';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(r * 0.85, 0);
        for (let s = 0; s < 4; s++) {
            const px = r * 0.85 + (len - r * 0.85) * (s + 1) / 4;
            this.ctx.lineTo(px, Math.sin(t * 4 + i * 7 + s * 3) * r * 0.12);
        }
        this.ctx.stroke();
        if (i % 2 === 0) {
            this.ctx.strokeStyle = `rgba(0, 210, 255, ${0.4 + Math.sin(t * 4.2 + i) * 0.25})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.shadowColor = '#22d3ee';
            this.ctx.rotate(0.18);
            this.ctx.beginPath();
            this.ctx.moveTo(r * 0.9, 0);
            const sl = r * (0.9 + Math.sin(t * 2.7 + i) * 0.2);
            this.ctx.lineTo(sl, Math.sin(t * 5 + i * 4) * r * 0.08);
            this.ctx.lineTo(sl + r * 0.18, Math.sin(t * 3 + i * 2) * r * 0.14);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    // Orbiting diamond shards
    for (let i = 0; i < 8; i++) {
        const angle = t * (0.9 + (i % 3) * 0.4) + (i / 8) * Math.PI * 2;
        const dist = r * (1.35 + Math.sin(t * 1.5 + i * 0.8) * 0.2);
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist;
        const sz = r * (0.06 + Math.sin(t * 3 + i) * 0.025);
        const col = i % 3 === 0 ? 'rgba(168,85,247,0.9)' : i % 3 === 1 ? 'rgba(0,210,255,0.85)' : 'rgba(80,0,180,0.7)';
        this.ctx.save();
        this.ctx.translate(sx, sy);
        this.ctx.rotate(angle * 1.7 + t);
        this.ctx.fillStyle = col;
        this.ctx.shadowColor = i % 3 === 1 ? '#22d3ee' : '#a855f7';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -sz * 2.2);
        this.ctx.lineTo(sz, 0);
        this.ctx.lineTo(0, sz * 1.2);
        this.ctx.lineTo(-sz, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    // Vortex ring
    for (let i = 0; i < 20; i++) {
        const a1 = (i / 20) * Math.PI * 2 + t * 1.4;
        const a2 = a1 + (Math.PI / 20) * 0.7;
        this.ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 + Math.sin(t * 4 + i * 0.8) * 0.3})`;
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowColor = '#7c3aed';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 1.18, a1, a2);
        this.ctx.stroke();
    }

} else if (effect === 'neon-crown-aura') {
    const t = Date.now() / 1000;
    const cx = this.centerX, cy = this.centerY, r = this.radius;
    const crownBaseY = cy - r * 1.05;
    const crownR = r * 0.75;

    // Bicolor aura
    const auraR = r * (1.6 + Math.sin(t * 2.2) * 0.08);
    const auraG = this.ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, auraR);
    auraG.addColorStop(0, 'rgba(236, 72, 153, 0.28)');
    auraG.addColorStop(0.5, 'rgba(34, 211, 238, 0.14)');
    auraG.addColorStop(1, 'transparent');
    this.ctx.fillStyle = auraG;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
    this.ctx.fill();

    // Electric tines (5 spikes)
    for (let i = 0; i < 5; i++) {
        const spikeAngle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const bx = cx + Math.cos(spikeAngle) * crownR;
        const by = crownBaseY + Math.sin(spikeAngle) * crownR * 0.32;
        const chargePhase = t * 2.8 + i * 1.3;
        const spikeH = r * (0.55 + Math.sin(chargePhase) * 0.18);
        const tipX = bx + Math.cos(spikeAngle - Math.PI / 2) * spikeH * 0.3;
        const tipY = by - spikeH;
        const charge = 0.5 + Math.sin(chargePhase * 1.1) * 0.35;
        const midX = (bx + tipX) / 2 + Math.sin(t * 5 + i * 2) * r * 0.04;
        const midY = (by + tipY) / 2;

        // Outer glow
        this.ctx.strokeStyle = `rgba(244,114,182,${charge * 0.5})`;
        this.ctx.lineWidth = 5;
        this.ctx.shadowColor = '#f472b6';
        this.ctx.shadowBlur = 18;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(bx, by);
        this.ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        this.ctx.stroke();

        // Inner core
        this.ctx.strokeStyle = `rgba(224,242,254,${0.7 + charge * 0.3})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(bx, by);
        this.ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        this.ctx.stroke();

        // Plasma tip
        const ballR = r * (0.045 + Math.sin(chargePhase * 1.5) * 0.02);
        const bg = this.ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, ballR * 3);
        bg.addColorStop(0, `rgba(255,255,255,${charge})`);
        bg.addColorStop(0.4, `rgba(34,211,238,${charge * 0.8})`);
        bg.addColorStop(1, 'transparent');
        this.ctx.fillStyle = bg;
        this.ctx.beginPath();
        this.ctx.arc(tipX, tipY, ballR * 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Wobbling plasma base ring (two-pass)
    for (let pass = 0; pass < 2; pass++) {
        this.ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
            const a = (i / 80) * Math.PI * 2 - Math.PI / 2;
            const noise = Math.sin(t * 6 + i * 0.5) * r * 0.025;
            const rx = cx + Math.cos(a) * (crownR + noise);
            const ry = crownBaseY + Math.sin(a) * (crownR * 0.32 + noise * 0.3);
            i === 0 ? this.ctx.moveTo(rx, ry) : this.ctx.lineTo(rx, ry);
        }
        this.ctx.closePath();
        if (pass === 0) {
            this.ctx.strokeStyle = 'rgba(244,114,182,0.55)';
            this.ctx.lineWidth = 3.5;
            this.ctx.shadowColor = '#f472b6';
            this.ctx.shadowBlur = 14;
        } else {
            this.ctx.strokeStyle = 'rgba(224,242,254,0.9)';
            this.ctx.lineWidth = 1;
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.shadowBlur = 8;
        }
        this.ctx.stroke();
    }

    // Orbiting plasma sparks
    for (let i = 0; i < 12; i++) {
        const sa = t * 0.8 + (i / 12) * Math.PI * 2;
        const orbit = crownR * (1.2 + Math.sin(t * 2 + i * 0.7) * 0.15);
        const sx = cx + Math.cos(sa) * orbit;
        const sy = crownBaseY + Math.sin(sa) * orbit * 0.35;
        const alpha = 0.4 + Math.sin(t * 3.5 + i) * 0.4;
        this.ctx.fillStyle = i % 2 === 0 ? `rgba(34,211,238,${alpha})` : `rgba(244,114,182,${alpha})`;
        this.ctx.shadowColor = i % 2 === 0 ? '#22d3ee' : '#f472b6';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, r * (0.025 + Math.sin(t * 4 + i * 1.3) * 0.015), 0, Math.PI * 2);
        this.ctx.fill();
    }
        } else if (effect === 'blackhole') {
            const time = Date.now() / 1000;
            const orbitRadius = this.radius * 1.8;
            const holeRadius = this.radius * 0.3;
            for (let i = 0; i < 3; i++) {
                const angle = time + (i * Math.PI * 2 / 3);
                const x = this.centerX + Math.cos(angle) * orbitRadius;
                const y = this.centerY + Math.sin(angle) * orbitRadius;
                
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, holeRadius);
                gradient.addColorStop(0, '#000');
                gradient.addColorStop(0.6, '#1a0033');
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
        } else if (effect === 'wings') {
            if (this.wingImageLoaded) {
            const wingWidth = this.radius * 2.4;
            const wingHeight = this.radius * 3.0;
            const time = Date.now() / 1000;
            const flapOffset = Math.sin(time * 3) * 0.15;
            this.ctx.save();
            this.ctx.translate(this.centerX - this.radius * 0.7, this.centerY);
            this.ctx.rotate(-flapOffset);
            this.ctx.drawImage(
                this.wingImage,
                -wingWidth,
                -wingHeight / 2,
                wingWidth,
                wingHeight
            );
            this.ctx.restore();
            this.ctx.save();
            this.ctx.translate(this.centerX + this.radius * 0.7, this.centerY);
            this.ctx.rotate(flapOffset);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(
                this.wingImage,
                -wingWidth,
                -wingHeight / 2,
                wingWidth,
                wingHeight
            );
            this.ctx.restore();

            } 
          
    } else if (effect === 'solar-flare-aura') {
    const t = Date.now() / 1000;
    const cx = this.centerX, cy = this.centerY, r = this.radius;

    // ── Init persistent state on first call ──
    if (!this._solar) {
        this._solar = {
            particles: [],
            loops: [],
            flares: [],
            flareTimer: 0,
            lastTime: t
        };
        const s = this._solar;

        class SolarParticle {
            constructor() { this.reset(true, cx, cy, r); }
            reset(init, cx, cy, r) {
                this._cx = cx; this._cy = cy; this._r = r;
                this.type = Math.random() < 0.55 ? 'granule' : 'ejecta';
                if (this.type === 'granule') {
                    const a = Math.random() * Math.PI * 2;
                    const d = r * (0.75 + Math.random() * 0.3);
                    this.x = cx + Math.cos(a) * d;
                    this.y = cy + Math.sin(a) * d;
                    this.vx = (Math.random() - 0.5) * 0.4;
                    this.vy = (Math.random() - 0.5) * 0.4;
                    this.life = init ? Math.random() : 0;
                    this.maxLife = 0.8 + Math.random() * 1.2;
                    this.size = 2 + Math.random() * 5;
                } else {
                    this.angle = Math.random() * Math.PI * 2;
                    this.speed = 1.2 + Math.random() * 2.8;
                    this.x = cx + Math.cos(this.angle) * r * 0.95;
                    this.y = cy + Math.sin(this.angle) * r * 0.95;
                    this.vx = Math.cos(this.angle) * this.speed + (Math.random()-0.5)*0.8;
                    this.vy = Math.sin(this.angle) * this.speed + (Math.random()-0.5)*0.8;
                    this.life = init ? Math.random() : 0;
                    this.maxLife = 0.6 + Math.random() * 1.0;
                    this.size = 1.5 + Math.random() * 3.5;
                }
            }
            update(dt) {
                this.x += this.vx; this.y += this.vy;
                this.life += dt * 0.7;
                if (this.type === 'ejecta') { this.vx *= 0.985; this.vy *= 0.985; }
                if (this.life > this.maxLife) this.reset(false, this._cx, this._cy, this._r);
            }
            draw(ctx) {
                const p = this.life / this.maxLife;
                const alpha = p < 0.2 ? p/0.2 : p > 0.7 ? 1-(p-0.7)/0.3 : 1;
                if (this.type === 'granule') {
                    ctx.fillStyle = p < 0.5
                        ? `rgba(255,${180+Math.floor(p*150)},50,${alpha*0.7})`
                        : `rgba(255,${Math.floor(220*(1-p))},0,${alpha*0.5})`;
                } else {
                    ctx.fillStyle = `rgba(255,${Math.floor(200*(1-p*0.8))},20,${alpha*0.85})`;
                }
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size*(1-p*0.5), 0, Math.PI*2);
                ctx.fill();
            }
        }

        class CoronalLoop {
            constructor() { this.reset(cx, cy, r); }
            reset(cx, cy, r) {
                this._cx = cx; this._cy = cy; this._r = r;
                this.baseAngle = Math.random() * Math.PI * 2;
                this.spread = 0.3 + Math.random() * 0.5;
                this.height = r * (0.5 + Math.random() * 1.1);
                this.life = Math.random() * 3;
                this.maxLife = 2.5 + Math.random() * 3.0;
                this.width = 1.5 + Math.random() * 3;
                this.color = Math.random() < 0.5 ? 'orange' : 'white';
            }
            update(dt) {
                this.life += dt * 0.35;
                if (this.life > this.maxLife) this.reset(this._cx, this._cy, this._r);
            }
            draw(ctx) {
                const p = this.life / this.maxLife;
                const alpha = p < 0.15 ? p/0.15 : p > 0.75 ? 1-(p-0.75)/0.25 : 1;
                const a1 = this.baseAngle - this.spread/2, a2 = this.baseAngle + this.spread/2;
                const x1 = this._cx + Math.cos(a1)*this._r, y1 = this._cy + Math.sin(a1)*this._r;
                const x2 = this._cx + Math.cos(a2)*this._r, y2 = this._cy + Math.sin(a2)*this._r;
                const cpx = this._cx + Math.cos(this.baseAngle)*(this._r + this.height);
                const cpy = this._cy + Math.sin(this.baseAngle)*(this._r + this.height);
                ctx.save();
                ctx.strokeStyle = this.color === 'orange'
                    ? `rgba(255,140,0,${alpha*0.45})` : `rgba(255,220,120,${alpha*0.55})`;
                ctx.shadowColor = this.color === 'orange' ? '#ff6600' : '#fffbe0';
                ctx.shadowBlur = 18; ctx.lineWidth = this.width * 3.5; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cpx,cpy,x2,y2); ctx.stroke();
                ctx.strokeStyle = this.color === 'orange'
                    ? `rgba(255,230,100,${alpha*0.9})` : `rgba(255,255,255,${alpha*0.95})`;
                ctx.shadowBlur = 8; ctx.lineWidth = this.width;
                ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cpx,cpy,x2,y2); ctx.stroke();
                ctx.restore();
            }
        }

        s.SolarParticle = SolarParticle;
        s.CoronalLoop = CoronalLoop;
        for (let i = 0; i < 80; i++) s.particles.push(new SolarParticle());
        for (let i = 0; i < 6; i++) s.loops.push(new CoronalLoop());
    }

    const s = this._solar;
    const dt = Math.min(t - s.lastTime, 0.05);
    s.lastTime = t;
    const ctx2 = this.ctx;

    // ── Corona glow layers ──
    [[r*1.08,r*0.38,'rgba(255,180,40,0.22)'],[r,r*0.65,'rgba(255,120,0,0.15)'],
     [r,r*1.1,'rgba(255,60,0,0.08)'],[r,r*1.8,'rgba(200,30,0,0.04)']
    ].forEach(([inner,size,col]) => {
        const g = ctx2.createRadialGradient(cx,cy,inner,cx,cy,inner+size);
        g.addColorStop(0,col); g.addColorStop(1,'transparent');
        ctx2.fillStyle=g; ctx2.beginPath(); ctx2.arc(cx,cy,inner+size,0,Math.PI*2); ctx2.fill();
    });

    // Corona streamers
    for (let i = 0; i < 14; i++) {
        const a = (i/14)*Math.PI*2 + t*0.04;
        const bright = 0.12 + Math.sin(t*1.3+i*0.7)*0.07;
        const len = r*(1.0+Math.sin(t*0.9+i*1.1)*0.3);
        const g = ctx2.createLinearGradient(cx+Math.cos(a)*r,cy+Math.sin(a)*r,cx+Math.cos(a)*(r+len),cy+Math.sin(a)*(r+len));
        g.addColorStop(0,`rgba(255,200,80,${bright})`); g.addColorStop(1,'transparent');
        ctx2.strokeStyle=g; ctx2.lineWidth=1+Math.sin(t*2+i)*0.5;
        ctx2.beginPath(); ctx2.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
        ctx2.lineTo(cx+Math.cos(a)*(r+len),cy+Math.sin(a)*(r+len)); ctx2.stroke();
    }

    // Coronal loops (behind sphere)
    s.loops.forEach(l => { l.update(dt); l.draw(ctx2); });

    // Ejecta particles (behind sphere)
    s.particles.filter(p=>p.type==='ejecta').forEach(p=>{ p.update(dt); p.draw(ctx2); });

    // ── Draw the sphere itself here via fallthrough — sphere draws after this block ──
    // (The sphere is drawn by drawSphere() after drawEffect() returns)

    // Surface granules (on top)
    s.particles.filter(p=>p.type==='granule').forEach(p=>{ p.update(dt); p.draw(ctx2); });

    // Flare eruptions
    s.flareTimer -= dt;
    if (s.flareTimer <= 0) {
        const flare = {
            angle: Math.random()*Math.PI*2,
            life: 0,
            maxLife: 0.9+Math.random()*0.8,
            length: r*(0.8+Math.random()*1.4),
            width: 8+Math.random()*18,
            active: true
        };
        s.flares.push(flare);
        if (Math.random()<0.3) s.flares.push({...flare, angle: flare.angle+0.3, life:0});
        s.flareTimer = 1.2 + Math.random()*2.5;
    }
    for (let i = s.flares.length-1; i >= 0; i--) {
        const f = s.flares[i];
        f.life += dt * 1.1;
        if (f.life > f.maxLife) { s.flares.splice(i,1); continue; }
        const p = f.life/f.maxLife;
        const scale = p < 0.3 ? p/0.3 : 1;
        const alpha = p > 0.6 ? 1-(p-0.6)/0.4 : 1;
        const len2 = f.length * scale;
        const tipX = cx + Math.cos(f.angle)*(r+len2);
        const tipY = cy + Math.sin(f.angle)*(r+len2);
        const bx = cx+Math.cos(f.angle)*r*0.92, by = cy+Math.sin(f.angle)*r*0.92;
        const perp = {x:-Math.sin(f.angle),y:Math.cos(f.angle)};
        const cpx2 = cx+Math.cos(f.angle)*(r+len2*0.5)+perp.x*len2*0.15;
        const cpy2 = cy+Math.sin(f.angle)*(r+len2*0.5)+perp.y*len2*0.15;
        ctx2.save();
        const fg = ctx2.createLinearGradient(bx,by,tipX,tipY);
        fg.addColorStop(0,`rgba(255,200,0,${alpha*0.9})`);
        fg.addColorStop(0.4,`rgba(255,120,0,${alpha*0.7})`);
        fg.addColorStop(1,'rgba(255,40,0,0)');
        ctx2.strokeStyle=fg; ctx2.lineWidth=f.width*(1-p*0.6); ctx2.lineCap='round';
        ctx2.shadowColor='#ff8800'; ctx2.shadowBlur=30;
        ctx2.beginPath(); ctx2.moveTo(bx,by); ctx2.quadraticCurveTo(cpx2,cpy2,tipX,tipY); ctx2.stroke();
        const fg2 = ctx2.createLinearGradient(bx,by,tipX,tipY);
        fg2.addColorStop(0,`rgba(255,255,255,${alpha})`);
        fg2.addColorStop(0.5,`rgba(255,220,100,${alpha*0.8})`);
        fg2.addColorStop(1,'rgba(255,100,0,0)');
        ctx2.strokeStyle=fg2; ctx2.lineWidth=f.width*0.22;
        ctx2.shadowColor='#ffffff'; ctx2.shadowBlur=15;
        ctx2.beginPath(); ctx2.moveTo(bx,by); ctx2.quadraticCurveTo(cpx2,cpy2,tipX,tipY); ctx2.stroke();
        ctx2.restore();
    }

    // Limb darkening ring
    const limb = ctx2.createRadialGradient(cx,cy,r*0.78,cx,cy,r);
    limb.addColorStop(0,'transparent'); limb.addColorStop(1,'rgba(255,60,0,0.35)');
    ctx2.fillStyle=limb; ctx2.beginPath(); ctx2.arc(cx,cy,r,0,Math.PI*2); ctx2.fill();
        }
        
    }
    
    drawSword(sword) {
    if (sword === 'none') return;
    
    const swordX = this.centerX + this.radius * 1.2; // Position to the right of sphere
    const swordY = this.centerY;
    const swordWidth = this.radius * 0.8;
    const swordHeight = this.radius * 2;
    
    this.ctx.save();
    this.ctx.translate(swordX, swordY);
    this.ctx.rotate(Math.PI / 6); 
    
    if (sword === 'stick') {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-swordWidth * 0.1, -swordHeight * 0.45, swordWidth * 0.2, swordHeight * 0.9);
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(-swordWidth * 0.15, swordHeight * 0.35, swordWidth * 0.3, swordHeight * 0.15);
        
    } else if (sword === 'stone') {
        // Stone sword - gray blade
        this.ctx.fillStyle = '#808080';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -swordHeight * 0.45);
        this.ctx.lineTo(swordWidth * 0.15, -swordHeight * 0.25);
        this.ctx.lineTo(swordWidth * 0.15, swordHeight * 0.35);
        this.ctx.lineTo(-swordWidth * 0.15, swordHeight * 0.35);
        this.ctx.lineTo(-swordWidth * 0.15, -swordHeight * 0.25);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(-swordWidth * 0.3, swordHeight * 0.32, swordWidth * 0.6, swordHeight * 0.08);
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(-swordWidth * 0.1, swordHeight * 0.35, swordWidth * 0.2, swordHeight * 0.15);
        
    } else if (sword === 'dragon') {
        
            const gradient = this.ctx.createLinearGradient(0, -swordHeight * 0.45, 0, swordHeight * 0.35);
            gradient.addColorStop(0, '#ff4500');
            gradient.addColorStop(1, '#ff8c00');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, -swordHeight * 0.45);
            this.ctx.lineTo(swordWidth * 0.2, -swordHeight * 0.25);
            this.ctx.lineTo(swordWidth * 0.2, swordHeight * 0.35);
            this.ctx.lineTo(-swordWidth * 0.2, swordHeight * 0.35);
            this.ctx.lineTo(-swordWidth * 0.2, -swordHeight * 0.25);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(-swordWidth * 0.35, swordHeight * 0.32, swordWidth * 0.7, swordHeight * 0.08);
            this.ctx.fillStyle = '#8b0000';
            this.ctx.fillRect(-swordWidth * 0.12, swordHeight * 0.35, swordWidth * 0.24, swordHeight * 0.15);
    }else if (sword === 'lightning') {
    // Lightning blade - yellow/white electric sword
    const gradient = this.ctx.createLinearGradient(0, -swordHeight * 0.45, 0, swordHeight * 0.35);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(1, '#ffd700');
    this.ctx.fillStyle = gradient;
    
    // Jagged blade
    this.ctx.beginPath();
    this.ctx.moveTo(0, -swordHeight * 0.45);
    const points = 8;
    for (let i = 0; i < points; i++) {
        const y = -swordHeight * 0.45 + (swordHeight * 0.8 * i / points);
        const x = (i % 2 === 0 ? swordWidth * 0.22 : swordWidth * 0.15) * (i % 4 < 2 ? 1 : -1);
        this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(-swordWidth * 0.18, swordHeight * 0.35);
    this.ctx.lineTo(swordWidth * 0.18, swordHeight * 0.35);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Electric glow
    this.ctx.shadowColor = '#ffff00';
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Guard
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillRect(-swordWidth * 0.35, swordHeight * 0.32, swordWidth * 0.7, swordHeight * 0.08);
    
    // Handle
    this.ctx.fillStyle = '#666';
    this.ctx.fillRect(-swordWidth * 0.12, swordHeight * 0.35, swordWidth * 0.24, swordHeight * 0.15);
}
    
    this.ctx.restore();
}
    startAnimation(cosmetics) {
        this.shouldAnimate = true;
        this.cosmetics = cosmetics;
        
        const animate = () => {
            if (!this.shouldAnimate) return;
            
            this.draw(this.cosmetics);
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    stopAnimation() {
    this.shouldAnimate = false;
    if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
    }
    delete this._solar; // add this
}


    updateCosmetics(cosmetics) {
        this.cosmetics = cosmetics;
        this.draw(cosmetics);
    }
    
    destroy() {
    this.stopAnimation();
    if (this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    delete this._solar; // add this
}
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerSphere;
}
