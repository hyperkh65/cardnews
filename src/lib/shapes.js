// SVG 도형 컴포넌트

export function Rectangle({ width, height, fill, stroke, strokeWidth }) {
    return (
        <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
            <rect
                width={width}
                height={height}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
}

export function Circle({ size, fill, stroke, strokeWidth }) {
    const radius = size / 2;
    return (
        <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <circle
                cx={radius}
                cy={radius}
                r={radius - strokeWidth / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
}

export function Star({ size, fill, stroke, strokeWidth }) {
    const points = generateStarPoints(size / 2, size / 2, 5, size / 2 - 5, (size / 2 - 5) * 0.5);

    return (
        <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <polygon
                points={points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
}

export function Triangle({ size, fill, stroke, strokeWidth }) {
    const height = size * (Math.sqrt(3) / 2);
    const points = `${size / 2},${strokeWidth} ${size - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`;

    return (
        <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <polygon
                points={points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
}

export function Heart({ size, fill, stroke, strokeWidth }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
}

export function Arrow({ size, fill, stroke, strokeWidth }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 2L2 12l10 10V2z"
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
}

// 별 좌표 생성 헬퍼
function generateStarPoints(cx, cy, spikes, outerRadius, innerRadius) {
    const points = [];
    const step = Math.PI / spikes;

    for (let i = 0; i < 2 * spikes; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = i * step - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }

    return points.join(' ');
}

export const shapes = [
    { id: 'rectangle', name: '사각형', component: Rectangle },
    { id: 'circle', name: '원', component: Circle },
    { id: 'star', name: '별', component: Star },
    { id: 'triangle', name: '삼각형', component: Triangle },
    { id: 'heart', name: '하트', component: Heart },
    { id: 'arrow', name: '화살표', component: Arrow },
];
