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
            const time = Date.now() / 1000;
            const pulseSize = this.radius * (1.7 + Math.sin(time * 4) * 0.12);
            const gradient = this.ctx.createRadialGradient(
                this.centerX, this.centerY, this.radius * 0.65,
                this.centerX, this.centerY, pulseSize
            );
            gradient.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
            gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.25)');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();

            for (let i = 0; i < 12; i++) {
                const angle = (time * 2.8) + (i * Math.PI / 6);
                const distance = this.radius * (1.25 + Math.sin(time * 2 + i) * 0.15);
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle + time * 2);
                this.ctx.fillStyle = i % 2 === 0 ? '#22d3ee' : '#a855f7';
                this.ctx.fillRect(-this.radius * 0.05, -this.radius * 0.05, this.radius * 0.1, this.radius * 0.1);
                this.ctx.restore();
            }

        } else if (effect === 'neon-crown-aura') {
            const time = Date.now() / 1000;
            const haloRadius = this.radius * (1.55 + Math.sin(time * 3.2) * 0.08);
            const halo = this.ctx.createRadialGradient(
                this.centerX, this.centerY, this.radius * 0.9,
                this.centerX, this.centerY, haloRadius
            );
            halo.addColorStop(0, 'rgba(244, 114, 182, 0.35)');
            halo.addColorStop(0.55, 'rgba(34, 211, 238, 0.22)');
            halo.addColorStop(1, 'transparent');
            this.ctx.fillStyle = halo;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, haloRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Floating neon crown
            const crownY = this.centerY - this.radius * 1.3 + Math.sin(time * 2.5) * this.radius * 0.05;
            this.ctx.save();
            this.ctx.lineWidth = this.radius * 0.07;
            this.ctx.strokeStyle = '#22d3ee';
            this.ctx.shadowColor = '#f472b6';
            this.ctx.shadowBlur = this.radius * 0.4;
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX - this.radius * 0.48, crownY + this.radius * 0.2);
            this.ctx.lineTo(this.centerX - this.radius * 0.26, crownY - this.radius * 0.18);
            this.ctx.lineTo(this.centerX, crownY + this.radius * 0.04);
            this.ctx.lineTo(this.centerX + this.radius * 0.26, crownY - this.radius * 0.18);
            this.ctx.lineTo(this.centerX + this.radius * 0.48, crownY + this.radius * 0.2);
            this.ctx.stroke();
            this.ctx.restore();

        } else if (effect === 'solar-flare-aura') {
            const time = Date.now() / 1000;
            const flareRadius = this.radius * (1.72 + Math.sin(time * 5) * 0.1);

            const flare = this.ctx.createRadialGradient(
                this.centerX, this.centerY, this.radius * 0.6,
                this.centerX, this.centerY, flareRadius
            );
            flare.addColorStop(0, 'rgba(255, 220, 90, 0.38)');
            flare.addColorStop(0.45, 'rgba(255, 120, 0, 0.28)');
            flare.addColorStop(1, 'transparent');
            this.ctx.fillStyle = flare;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, flareRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Rotating sun rays
            for (let i = 0; i < 10; i++) {
                const angle = (time * 1.7) + (i * Math.PI / 5);
                const inner = this.radius * 1.05;
                const outer = this.radius * 1.75;
                const x1 = this.centerX + Math.cos(angle) * inner;
                const y1 = this.centerY + Math.sin(angle) * inner;
                const x2 = this.centerX + Math.cos(angle) * outer;
                const y2 = this.centerY + Math.sin(angle) * outer;

                this.ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 230, 120, 0.9)' : 'rgba(255, 140, 40, 0.75)';
                this.ctx.lineWidth = this.radius * 0.05;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }

            // Orbiting sparks
            for (let i = 0; i < 8; i++) {
                const angle = (time * 3.4) + (i * Math.PI / 4);
                const distance = this.radius * 1.45;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                this.ctx.fillStyle = i % 2 === 0 ? '#fff3b0' : '#ff9a3c';
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.radius * 0.07, 0, Math.PI * 2);
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
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerSphere;
}
