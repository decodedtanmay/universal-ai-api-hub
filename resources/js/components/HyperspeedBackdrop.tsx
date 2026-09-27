import Hyperspeed from './reactbits/Hyperspeed';

/**
 * Violet light-trail road, built from the React Bits Hyperspeed "one" preset.
 * Kept in its own module so three.js and postprocessing load lazily, only when this background is shown.
 */
const violetRoad = {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5] as [number, number],
    lightStickHeight: [1.3, 1.7] as [number, number],
    movingAwaySpeed: [60, 80] as [number, number],
    movingCloserSpeed: [-120, -160] as [number, number],
    carLightsLength: [400 * 0.03, 400 * 0.2] as [number, number],
    carLightsRadius: [0.05, 0.14] as [number, number],
    carWidthPercentage: [0.3, 0.5] as [number, number],
    carShiftX: [-0.8, 0.8] as [number, number],
    carFloorSeparation: [0, 5] as [number, number],
    colors: {
        roadColor: 0x0a0812,
        islandColor: 0x0c0a16,
        background: 0x0b0914,
        shoulderLines: 0x1e1a2e,
        brokenLines: 0x1e1a2e,
        leftCars: [0xa78bfa, 0x7c3aed, 0xc4b5fd],
        rightCars: [0xe879f9, 0x8b5cf6, 0x6d28d9],
        sticks: 0xa78bfa,
    },
};

export default function HyperspeedBackdrop() {
    return <Hyperspeed effectOptions={violetRoad} />;
}
