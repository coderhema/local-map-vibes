import { Canvas, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

function Stars({ map, dark }: { map: MapLibreMap; dark: boolean }) {
  const { size, invalidate } = useThree();
  const palette = useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    return { star: css.getPropertyValue('--star-color').trim() };
  }, [dark]);
  useMemo(() => invalidate(), [invalidate, size.width, size.height]);
  const radius = 512 * 2 ** map.getZoom() / (2 * Math.PI);
  const padding = map.getPadding();
  const cx = ((padding.left ?? 0) - (padding.right ?? 0)) / 2;
  const cy = ((padding.bottom ?? 0) - (padding.top ?? 0)) / 2;
  return (
    <>
      {Array.from({ length: 90 }, (_, i) => {
        const x = ((i * 137.508) % size.width) - size.width / 2;
        const y = ((i * 219.37) % size.height) - size.height / 2;
        const visible = dark && map.getProjection().type === 'globe' && Math.hypot(x - cx, y - cy) > radius + 10;
        return (
          <mesh key={i} position={[x, y, -20]} visible={visible}>
            <sphereGeometry args={[i % 5 === 0 ? 1.6 : 0.8, 5, 4]} />
            <meshBasicMaterial color={palette.star} />
          </mesh>
        );
      })}
    </>
  );
}

export default function WorldAtmosphere({ map, dark }: { map: MapLibreMap; dark: boolean }) {
  return (
    <div className="world-atmosphere" aria-hidden="true">
      <Canvas frameloop="demand" orthographic camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 2000 }} dpr={1} gl={{ alpha: true, antialias: false }}>
        <Stars map={map} dark={dark} />
      </Canvas>
    </div>
  );
}
