/**
 * ClickSpark, from the React Bits registry (https://reactbits.dev).
 * Local change: renders one fixed, viewport-sized canvas that listens for clicks on the window (instead of a canvas
 * as tall as its wrapper), and only runs its animation loop while sparks are on screen. Drawing math is unchanged.
 */
import { useEffect, useRef } from 'react';

interface ClickSparkProps {
    sparkColor?: string;
    sparkSize?: number;
    sparkRadius?: number;
    sparkCount?: number;
    duration?: number;
    extraScale?: number;
}

interface Spark {
    x: number;
    y: number;
    angle: number;
    startTime: number;
}

const easeOut = (t: number) => t * (2 - t);

export default function ClickSpark({ sparkColor = '#fff', sparkSize = 10, sparkRadius = 15, sparkCount = 8, duration = 400, extraScale = 1 }: ClickSparkProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let sparks: Spark[] = [];
        let frame = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const draw = (timestamp: number) => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            sparks = sparks.filter((spark) => {
                const elapsed = timestamp - spark.startTime;
                if (elapsed >= duration) return false;
                const eased = easeOut(elapsed / duration);
                const distance = eased * sparkRadius * extraScale;
                const lineLength = sparkSize * (1 - eased);
                ctx.strokeStyle = sparkColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
                ctx.lineTo(spark.x + (distance + lineLength) * Math.cos(spark.angle), spark.y + (distance + lineLength) * Math.sin(spark.angle));
                ctx.stroke();

                return true;
            });
            frame = sparks.length ? requestAnimationFrame(draw) : 0;
        };

        const onPointerDown = (event: PointerEvent) => {
            const now = performance.now();
            for (let i = 0; i < sparkCount; i++) {
                sparks.push({ x: event.clientX, y: event.clientY, angle: (2 * Math.PI * i) / sparkCount, startTime: now });
            }
            if (!frame) frame = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('pointerdown', onPointerDown, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointerdown', onPointerDown);
        };
    }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, extraScale]);

    return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 80 }} />;
}
