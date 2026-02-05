/* =============================================
   ĐÀO DƯƠNG DU - PORTFOLIO EFFECTS ENGINE
   Cinematic Effects & Smooth Interactions
   ============================================= */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        tilt: { maxAngle: 8, easing: 0.1, scale: 1.02 },
        magnetic: { strength: 0.25, easing: 0.15 },
        particles: { count: 40, speed: 0.2, connectionDistance: 120 }
    };

    // State
    const state = {
        mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
        windowSize: { width: window.innerWidth, height: window.innerHeight },
        accentColors: { cyan: 195, violet: 270, rose: 340, amber: 35, emerald: 160 }
    };

    // Utilities
    const lerp = (a, b, t) => a + (b - a) * t;
    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), delay); };
    };

    // =========== CURSOR SYSTEM ===========
    class CursorSystem {
        constructor() {
            this.cursor = document.querySelector('.cursor-dot');
            this.glow = document.querySelector('.cursor-glow');
            if (!this.cursor || !this.glow) return;

            this.pos = { x: 0, y: 0 };
            this.glowPos = { x: 0, y: 0 };
            this.init();
        }

        init() {
            document.addEventListener('mousemove', (e) => {
                state.mouse.targetX = e.clientX;
                state.mouse.targetY = e.clientY;
                this.glow.style.opacity = '1';
            });

            document.querySelectorAll('a, button, .magnetic-element, .magnetic-btn, .tilt-card, input, textarea').forEach(el => {
                el.addEventListener('mouseenter', () => this.cursor.classList.add('hovering'));
                el.addEventListener('mouseleave', () => this.cursor.classList.remove('hovering'));
            });

            this.animate();
        }

        animate() {
            this.cursor.style.left = `${state.mouse.targetX}px`;
            this.cursor.style.top = `${state.mouse.targetY}px`;

            this.glow.style.left = `${state.mouse.targetX}px`;
            this.glow.style.top = `${state.mouse.targetY}px`;

            requestAnimationFrame(() => this.animate());
        }
    }

    // =========== SECTION OBSERVER ===========
    class SectionObserver {
        constructor() {
            this.sections = document.querySelectorAll('.section');
            this.currentAccent = 195;
            this.targetAccent = 195;
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
                        this.onSectionEnter(entry.target);
                    }
                });
            }, { threshold: [0.15, 0.5] });

            this.sections.forEach(s => observer.observe(s));
            this.animateAccent();
        }

        onSectionEnter(section) {
            section.classList.add('in-view');

            const accent = section.dataset.accent;
            if (accent && state.accentColors[accent]) {
                this.targetAccent = state.accentColors[accent];
            }

            // Reveal text animations
            section.querySelectorAll('.text-reveal:not(.revealed)').forEach((el, i) => {
                setTimeout(() => el.classList.add('revealed'), (parseInt(el.dataset.delay) || 0) + i * 80);
            });
        }

        animateAccent() {
            this.currentAccent = lerp(this.currentAccent, this.targetAccent, 0.02);
            document.documentElement.style.setProperty('--accent-h', this.currentAccent);
            requestAnimationFrame(() => this.animateAccent());
        }
    }

    // =========== 3D TILT SYSTEM ===========
    class TiltSystem {
        constructor() {
            this.cards = document.querySelectorAll('.tilt-card');
            this.states = new Map();
            this.init();
        }

        init() {
            this.cards.forEach(card => {
                this.states.set(card, { rotateX: 0, rotateY: 0, targetX: 0, targetY: 0, shineX: 50, shineY: 50 });
                card.addEventListener('mousemove', (e) => this.onMove(e, card));
                card.addEventListener('mouseleave', () => this.onLeave(card));
            });
            this.animate();
        }

        onMove(e, card) {
            const rect = card.getBoundingClientRect();
            const s = this.states.get(card);
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            s.targetY = ((e.clientX - centerX) / (rect.width / 2)) * CONFIG.tilt.maxAngle;
            s.targetX = -((e.clientY - centerY) / (rect.height / 2)) * CONFIG.tilt.maxAngle;
            s.shineX = ((e.clientX - rect.left) / rect.width) * 100;
            s.shineY = ((e.clientY - rect.top) / rect.height) * 100;

            const shine = card.querySelector('.card-shine');
            if (shine) shine.style.background = `radial-gradient(circle at ${s.shineX}% ${s.shineY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
        }

        onLeave(card) {
            const s = this.states.get(card);
            s.targetX = 0;
            s.targetY = 0;
            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            setTimeout(() => card.style.transition = '', 500);
        }

        animate() {
            this.cards.forEach(card => {
                const s = this.states.get(card);
                s.rotateX = lerp(s.rotateX, s.targetX, CONFIG.tilt.easing);
                s.rotateY = lerp(s.rotateY, s.targetY, CONFIG.tilt.easing);
                const scale = (Math.abs(s.targetX) > 0.01 || Math.abs(s.targetY) > 0.01) ? CONFIG.tilt.scale : 1;
                card.style.transform = `perspective(1000px) rotateX(${s.rotateX}deg) rotateY(${s.rotateY}deg) scale3d(${scale},${scale},${scale})`;
            });
            requestAnimationFrame(() => this.animate());
        }
    }

    // =========== MAGNETIC SYSTEM ===========
    class MagneticSystem {
        constructor() {
            this.elements = document.querySelectorAll('.magnetic-element, .magnetic-btn');
            this.states = new Map();
            this.init();
        }

        init() {
            this.elements.forEach(el => {
                this.states.set(el, { x: 0, y: 0, targetX: 0, targetY: 0, isHovered: false });
                el.addEventListener('mouseenter', () => this.states.get(el).isHovered = true);
                el.addEventListener('mousemove', (e) => this.onMove(e, el));
                el.addEventListener('mouseleave', () => {
                    const s = this.states.get(el);
                    s.isHovered = false;
                    s.targetX = 0;
                    s.targetY = 0;
                });
                el.addEventListener('click', () => this.onClick(el));
            });
            this.animate();
        }

        onMove(e, el) {
            const s = this.states.get(el);
            if (!s.isHovered) return;
            const rect = el.getBoundingClientRect();
            s.targetX = (e.clientX - rect.left - rect.width / 2) * CONFIG.magnetic.strength;
            s.targetY = (e.clientY - rect.top - rect.height / 2) * CONFIG.magnetic.strength;
        }

        onClick(el) {
            const ripple = el.querySelector('.btn-ripple');
            if (ripple) {
                ripple.classList.remove('active');
                void ripple.offsetWidth;
                ripple.classList.add('active');
            }
        }

        animate() {
            this.elements.forEach(el => {
                const s = this.states.get(el);
                s.x = lerp(s.x, s.targetX, CONFIG.magnetic.easing);
                s.y = lerp(s.y, s.targetY, CONFIG.magnetic.easing);
                el.style.transform = `translate(${s.x}px, ${s.y}px)`;
            });
            requestAnimationFrame(() => this.animate());
        }
    }

    // =========== PARTICLES SYSTEM ===========
    class ParticlesSystem {
        constructor() {
            this.canvas = document.getElementById('particles-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', debounce(() => this.resize(), 200));
            this.createParticles();
            this.animate();
        }

        resize() {
            this.canvas.width = state.windowSize.width = window.innerWidth;
            this.canvas.height = state.windowSize.height = window.innerHeight;
        }

        createParticles() {
            this.particles = [];
            for (let i = 0; i < CONFIG.particles.count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: 1 + Math.random() * 2,
                    speedX: (Math.random() - 0.5) * CONFIG.particles.speed,
                    speedY: (Math.random() - 0.5) * CONFIG.particles.speed,
                    opacity: 0.1 + Math.random() * 0.3
                });
            }
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
                this.ctx.fill();
            });

            // Connections
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONFIG.particles.connectionDistance) {
                        this.ctx.beginPath();
                        this.ctx.strokeStyle = `rgba(255,255,255,${0.12 * (1 - dist / CONFIG.particles.connectionDistance)})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(() => this.animate());
        }
    }

    // =========== NAVIGATION ===========
    class NavigationSystem {
        constructor() {
            this.nav = document.getElementById('nav');
            if (!this.nav) return;
            this.init();
        }

        init() {
            window.addEventListener('scroll', () => {
                this.nav.classList.toggle('scrolled', window.scrollY > 80);
            });

            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(link.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }
    }

    // =========== CONTACT FORM ===========
    class ContactForm {
        constructor() {
            this.form = document.getElementById('contactForm');
            if (!this.form) return;
            this.init();
        }

        init() {
            const inputs = this.form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('invalid', (e) => {
                    e.preventDefault();
                    input.classList.add('error');
                });
                input.addEventListener('input', () => input.classList.remove('error'));
            });

            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = this.form.querySelector('.submit-btn');
                btn.innerHTML = '<span class="btn-text">✓ Đã gửi!</span>';
                btn.style.background = 'hsl(160, 100%, 45%)';
                setTimeout(() => {
                    btn.innerHTML = '<span class="btn-text">Gửi tin nhắn</span><span class="btn-icon">→</span><div class="btn-glow"></div>';
                    btn.style.background = '';
                    this.form.reset();
                }, 2500);
            });
        }
    }

    // =========== PARALLAX ORBS ===========
    class ParallaxOrbs {
        constructor() {
            this.orbs = document.querySelectorAll('.gradient-orb');
            this.animate();
        }

        animate() {
            const scrollY = window.scrollY;
            const mouseX = (state.mouse.targetX - state.windowSize.width / 2) * 0.015;
            const mouseY = (state.mouse.targetY - state.windowSize.height / 2) * 0.015;

            this.orbs.forEach((orb, i) => {
                const speed = (i + 1) * 0.02;
                const yOffset = scrollY * speed;
                orb.style.transform = `translate(${mouseX * (i + 1)}px, ${yOffset + mouseY * (i + 1)}px)`;
            });

            requestAnimationFrame(() => this.animate());
        }
    }

    // =========== INIT ===========
    function init() {
        new CursorSystem();
        new SectionObserver();
        new TiltSystem();
        new MagneticSystem();
        new ParticlesSystem();
        new NavigationSystem();
        new ContactForm();
        new ParallaxOrbs();

        // Initial hero reveal
        setTimeout(() => {
            const hero = document.getElementById('hero');
            if (hero) hero.classList.add('in-view');
        }, 200);

        console.log('%c✨ Portfolio Loaded', 'color: #00d4ff; font-size: 14px; font-weight: bold;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
