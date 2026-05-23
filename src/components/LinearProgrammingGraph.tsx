"use client";

import React, { useMemo } from "react";
import { Mafs, Coordinates, Polygon, Line, Point, Text, Theme } from "mafs";
import "mafs/core.css";
import { SimplexResult } from "../models/SimplexResult";

interface LinearProgrammingGraphProps {
  result: SimplexResult | null;
}

export function LinearProgrammingGraph({ result }: LinearProgrammingGraphProps) {
  if (!result || !result.graphData) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-slate-500">
        <p>O gráfico está disponível apenas para problemas com 2 variáveis.</p>
      </div>
    );
  }

  const { feasibleRegion, constraints, objectiveLine, optimalPoint } = result.graphData;

  // CORREÇÃO 1: Tipagem explícita do retorno para satisfazer o TypeScript (Vector2)
  const viewBox = useMemo((): { x: [number, number]; y: [number, number] } => {
    let allPoints = [...feasibleRegion];
    constraints.forEach(c => allPoints.push(...c.points));
    allPoints.push(optimalPoint);
    if (objectiveLine) allPoints.push(...objectiveLine.points);

    if (allPoints.length === 0) return { x: [-10, 100], y: [-10, 100] };

    const xs = allPoints.map(p => p.x);
    const ys = allPoints.map(p => p.y);

    const minX = Math.min(0, ...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(0, ...ys);
    const maxY = Math.max(...ys);

    const paddingX = (maxX - minX) * 0.2 || 10;
    const paddingY = (maxY - minY) * 0.2 || 10;

    // "as [number, number]" força o tipo correto
    return {
      x: [minX - paddingX, maxX + paddingX] as [number, number],
      y: [minY - paddingY, maxY + paddingY] as [number, number],
    };
  }, [result]);

  return (
    <div className="w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm relative">
      {/* CORREÇÃO DO TEMA (FUNDO PRETO):
         Injetamos um CSS local para forçar as variáveis da Mafs dentro deste container.
         Isso sobrescreve o padrão dark mode da biblioteca.
      */}
      <style jsx>{`
        .mafs-container {
          --mafs-bg: #f8fafc;
          --mafs-fg: #334155;
          --mafs-line-color: #cbd5e1;
        }
        /* Força o background na classe interna da biblioteca */
        .mafs-container .MafsView {
          background-color: var(--mafs-bg) !important;
        }
      `}</style>

      <div className="mafs-container bg-slate-50">
        <Mafs
          viewBox={viewBox}
          height={500}
          preserveAspectRatio={false}
          pan={true}
          zoom={true}
        >
          <Coordinates.Cartesian 
            subdivisions={2}
            xAxis={{ 
              labels: (n) => (n % 10 === 0 ? n : ""), 
             
              lines: 1 // CORREÇÃO 2: Apenas número ou undefined, a cor vem do CSS acima
            }}
            yAxis={{ 
              labels: (n) => (n % 10 === 0 ? n : ""),
              
              lines: 1 // CORREÇÃO 3: Removido objeto de estilo inválido
            }}
          />

          {/* --- LÓGICA DE RENDERIZAÇÃO DA REGIÃO VIÁVEL --- */}
          
          {/* CASO 1: A região é um Polígono (Área com 3+ vértices) */}
          {feasibleRegion.length > 2 && (
            <Polygon
              points={feasibleRegion.map((p) => [p.x, p.y])}
              color={Theme.green}
              fillOpacity={0.2}
              strokeOpacity={1}
              weight={2}
            />
          )}

          {/* CASO 2: A região é um Segmento de Reta (Igualdade restritiva - Apenas 2 vértices) */}
          {feasibleRegion.length === 2 && (
            <Line.Segment
              point1={[feasibleRegion[0].x, feasibleRegion[0].y]}
              point2={[feasibleRegion[1].x, feasibleRegion[1].y]}
              color={Theme.green}
              opacity={1}
              weight={6} // Linha bem grossa para destacar que é a "Área" viável
            />
          )}
          
          {/* ------------------------------------------------ */}

          {constraints.map((constraint, idx) => {
             if (constraint.points.length < 2) return null;
             const p1 = constraint.points[0];
             const p2 = constraint.points[1];

             return (
               <React.Fragment key={`constraint-${idx}`}>
                 <Line.ThroughPoints
                   point1={[p1.x, p1.y]}
                   point2={[p2.x, p2.y]}
                   color={constraint.color || Theme.blue}
                   opacity={0.6}
                   weight={2}
                 />
                 <Text 
                   x={(p1.x + p2.x) / 2} 
                   y={(p1.y + p2.y) / 2} 
                   attach="s"
                   size={12}
                   color={constraint.color}
                 >
                   {constraint.name}
                 </Text>
               </React.Fragment>
             );
          })}

          {objectiveLine && objectiveLine.points.length >= 2 && (
            <Line.ThroughPoints
              point1={[objectiveLine.points[0].x, objectiveLine.points[0].y]}
              point2={[objectiveLine.points[1].x, objectiveLine.points[1].y]}
              color={Theme.pink}
              style="dashed"
              weight={2}
              opacity={0.8}
            />
          )}

          <Point x={optimalPoint.x} y={optimalPoint.y} color={Theme.red} />
          
          <Text
            x={optimalPoint.x}
            y={optimalPoint.y}
            attach="nw"
            color={Theme.red}
            size={14}
            // CORREÇÃO 4: 'weight' não existe, usamos svgTextProps para estilo CSS
            svgTextProps={{ style: { fontWeight: 'bold' } }}
          >
            {`  Ótimo (${optimalPoint.x.toFixed(1)}, ${optimalPoint.y.toFixed(1)})`}
          </Text>
          
        </Mafs>
      </div>

      <div className="p-3 bg-white border-t border-slate-200 text-xs flex flex-wrap gap-4 text-slate-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 opacity-40 border border-green-600"></div>
          <span className="font-medium">Área Viável</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-pink-500 border-t border-dashed border-pink-500"></div>
          <span className="font-medium">Função Objetivo (Z)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="font-medium">Ponto Ótimo</span>
        </div>
        {constraints.map((c, i) => (
           <div key={i} className="flex items-center gap-1">
             <div className="w-3 h-0.5" style={{ backgroundColor: c.color }}></div>
             <span>{c.name}</span>
           </div>
        ))}
      </div>
    </div>
  );
}