'use client';

import { useEffect, useRef } from 'react';

interface MatrixBackgroundProps {
    className?: string;
    opacity?: number;   // global layer opacity
    fontSize?: number;  // size of characters
    fade?: number;      // background fade strength per frame
    speed?: number;     // interval ms (lower = faster)
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({
    className = '',
    opacity = 0.5,       // increased from 0.25
    fontSize = 16,       // increased from 14
    fade = 0.06,         // slower fade (was 0.08)
    speed = 28,          // slightly faster refresh (was 30)
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // include more glyphs and some spaces to vary density subtly
        const matrix =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()[]{}<>/\\|~`+-=_;:.,';
        const matrixArray = matrix.split('');

        let columns = Math.floor(canvas.width / (fontSize * 0.9)); // slightly denser columns
        let drops: number[] = Array(columns).fill(1);

        const resetDrops = () => {
            columns = Math.floor(canvas.width / (fontSize * 0.9));
            drops = Array(columns).fill(1);
        };

        const draw = () => {
            // gentler fade to keep trails brighter/longer
            ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];

                // raise minimum alpha and bias brighter
                const alpha = Math.random() * 0.5 + 0.45; // 0.45 - 0.95
                // slight color shift to brighter green
                ctx.fillStyle = `rgba(0, 255, 90, ${alpha})`;

                const x = i * fontSize * 0.9; // match density change
                const y = drops[i] * fontSize;
                ctx.fillText(text, x, y);

                // reset more often to keep screen populated
                if (y > canvas.height && Math.random() > 0.94) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        };

        const interval = setInterval(draw, speed);

        const onResize = () => {
            resizeCanvas();
            resetDrops();
        };

        window.addEventListener('resize', onResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', onResize);
        };
    }, [fontSize, fade, speed]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 pointer-events-none z-0 ${className}`}
            style={{ opacity }}
        />
    );
};

export default MatrixBackground;
