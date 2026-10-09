import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { Group } from 'three';
import type { Map as MapLibreMap } from 'maplibre-gl';
const landmarks: { name: string; coords: [number, number]; shape: string }[] = [
  { name: 'Eiffel Tower', coords: [2.2945,48.8584], shape: 'tower' },
  { name: 'Great Pyramid of Giza', coords: [31.1342,29.9792], shape: 'pyramid' },
  { name: 'Washington Monument', coords: [-77.0353,38.8895], shape: 'obelisk' },
];
// Geographic anchors keep clouds on the map surface as the camera moves.
const cloudAnchors: [number, number][] = [[-28,12],[15,-8],[48,30],[-82,30],[112,12],[-140,-22],[5,52],[65,-24],[145,42]];
function Monument({shape,color}:{shape:string;color:string}) {
  if(shape==='pyramid') return <mesh position={[0,20,0]} rotation-y={Math.PI/4}><coneGeometry args={[34,40,4]}/><meshStandardMaterial color={color} roughness={0.8}/></mesh>;
  if(shape==='obelisk') return <group><mesh position={[0,27,0]}><cylinderGeometry args={[5,8,54,4]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,59,0]} rotation-y={Math.PI/4}><coneGeometry args={[7,10,4]}/><meshStandardMaterial color={color}/></mesh></group>;
  return <group>{[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}${z}`} position={[x*11,24,z*11]} rotation={[z*-0.19,0,x*0.19]}><cylinderGeometry args={[2,4,50,6]}/><meshStandardMaterial color={color} metalness={0.4} roughness={0.5}/></mesh>))}<mesh position={[0,42,0]}><boxGeometry args={[25,4,25]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,62,0]}><coneGeometry args={[12,38,4]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,90,0]}><cylinderGeometry args={[0.5,1.8,20,5]}/><meshStandardMaterial color={color}/></mesh></group>;
}
function Scenery({map,dark}:{map:MapLibreMap;dark:boolean}) {
 const {size, invalidate}=useThree(); const monuments=useRef<(Group|null)[]>([]); const clouds=useRef<(Group|null)[]>([]); const stars=useRef<Group>(null);
 const reduced=useMemo(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 useEffect(()=>{const redraw=()=>invalidate();map.on('render',redraw);const timer=reduced?null:window.setInterval(()=>{if(!document.hidden&&map.getProjection().type==='globe'&&map.getZoom()<5)invalidate();},66);return()=>{map.off('render',redraw);if(timer!==null)window.clearInterval(timer);};},[map,invalidate,reduced]);
 const palette=useMemo(()=>{const css=getComputedStyle(document.documentElement); return {cloud:css.getPropertyValue('--cloud-color').trim(),monument:css.getPropertyValue('--monument-color').trim(),star:css.getPropertyValue('--star-color').trim()};},[dark]);
 useFrame(({clock})=>{
  const center=map.getCenter(); const globe=map.getProjection().type==='globe' && map.getZoom()<5;
  const radius=512*2**map.getZoom()/(2*Math.PI); const padding=map.getPadding(); const cx=((padding.left??0)-(padding.right??0))/2,cy=((padding.bottom??0)-(padding.top??0))/2;
  monuments.current.forEach((group,i)=>{const landmark=landmarks[i];if(!group||!landmark)return;const p=map.project(landmark.coords);const r=Math.PI/180; const dot=Math.sin(center.lat*r)*Math.sin(landmark.coords[1]*r)+Math.cos(center.lat*r)*Math.cos(landmark.coords[1]*r)*Math.cos((landmark.coords[0]-center.lng)*r);
   group.visible=(!globe||dot>0.22)&&p.x>30&&p.x<size.width-30&&p.y>170&&p.y<size.height-30;
   group.position.set(p.x-size.width/2,size.height/2-p.y,0); group.rotation.set(0.25,-map.getBearing()*r+0.4,0);group.scale.setScalar(Math.min(1.15,Math.max(0.45,map.getZoom()/5)));
  });
  clouds.current.forEach((group,i)=>{
   const anchor=cloudAnchors[i];if(!group||!anchor)return;
   const r=Math.PI/180;const drift=reduced?0:Math.sin(clock.elapsedTime*0.015+i)*0.5;
   const coords:[number,number]=[anchor[0]+drift,anchor[1]];const p=map.project(coords);
   const dot=Math.sin(center.lat*r)*Math.sin(coords[1]*r)+Math.cos(center.lat*r)*Math.cos(coords[1]*r)*Math.cos((coords[0]-center.lng)*r);
   group.visible=map.getZoom()<10&&(!globe||dot>0.25)&&p.x>-90&&p.x<size.width+90&&p.y>150&&p.y<size.height+60;
   group.position.set(p.x-size.width/2,size.height/2-p.y+10,30);
   group.rotation.set(0.25,-map.getBearing()*r,0);
   group.scale.setScalar(Math.min(2,Math.max(0.65,2**(map.getZoom()-2.65)*0.7)));
  });
  stars.current?.children.forEach(star=>{star.visible=dark&&globe&&Math.hypot(star.position.x-cx,star.position.y-cy)>radius+10;});
 });
 return <><ambientLight intensity={0.6}/><directionalLight position={[-200,500,400]} intensity={2.4}/><Environment resolution={32}><Lightformer intensity={1.3} position={[0,200,100]} scale={[500,500,1]}/></Environment><group ref={stars}>{Array.from({length:90},(_,i)=><mesh key={i} position={[((i*137.508)%size.width)-size.width/2,((i*219.37)%size.height)-size.height/2,-20]}><sphereGeometry args={[i%5===0?1.6:0.8,5,4]}/><meshBasicMaterial color={palette.star}/></mesh>)}</group>{landmarks.map((landmark,i)=><group key={landmark.name} name={landmark.name} ref={node=>{monuments.current[i]=node;}}><Monument shape={landmark.shape} color={palette.monument}/></group>)}{cloudAnchors.map((_,i)=><group key={i} name={`Surface cloud ${i+1}`} ref={node=>{clouds.current[i]=node;}}>{[-2,-1,0,1,2].map(j=><mesh key={j} position={[j*16,j===0?12:Math.abs(j)===1?6:0,j%2*7]} scale={[1.25,1,1]}><sphereGeometry args={[j===0?22:Math.abs(j)===1?17:12,16,12]}/><meshStandardMaterial color={palette.cloud} transparent opacity={dark?0.72:0.88} roughness={1}/></mesh>)}</group>)}</>;
}
export default function WorldAtmosphere({map,dark}:{map:MapLibreMap;dark:boolean}) {
 return <div className="world-atmosphere" aria-hidden="true"><Canvas frameloop="demand" orthographic camera={{position:[0,0,1000],zoom:1,near:0.1,far:2000}} dpr={1} gl={{alpha:true,antialias:false}}><Scenery map={map} dark={dark}/></Canvas></div>;
}
