// Componente personalizado de gráfico de pizza
import React from 'react';
import { View } from 'react-native';
import { G, Path, Svg } from 'react-native-svg';

type ChartData = {
    name: string;
    value: number;
    color: string;
};

// Implementação simplificada que não usa SVG complexo
const SimplePieChart = ({ 
    data, 
    width, 
    height 
}: { 
    data: ChartData[]; 
    width: number;
    height: number;
}) => {
    // Se não há dados, retorna null
    if (!data || data.length === 0) {
        return null;
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return null;
    
    // Ajuste: sempre use o menor entre width e height para o círculo
    const circleSize = Math.min(width, height) * 0.9;
    
    // Pie chart real com fatias dinâmicas
    const renderPieSlices = () => {
        let startAngle = 0;
        const radius = circleSize / 2;
        const center = circleSize / 2;
        // Corrige: se só há uma categoria, desenhe um círculo completo
        if (data.length === 1) {
            return [
                <Path
                    key={0}
                    d={`M ${center} ${center} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`}
                    fill={data[0].color}
                    stroke="#fff"
                    strokeWidth={2}
                />
            ];
        }
        return data.map((item, i) => {
            const value = item.value;
            const angle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;
            const x1 = center + radius * Math.sin(startAngle);
            const y1 = center - radius * Math.cos(startAngle);
            const x2 = center + radius * Math.sin(endAngle);
            const y2 = center - radius * Math.cos(endAngle);
            const largeArcFlag = angle > Math.PI ? 1 : 0;
            const pathData = [
                `M ${center} ${center}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z',
            ].join(' ');
            const slice = (
                <Path
                    key={i}
                    d={pathData}
                    fill={item.color}
                    stroke="#fff"
                    strokeWidth={2}
                />
            );
            startAngle = endAngle;
            return slice;
        });
    };

    return (
        <View style={{ width, height, alignItems: 'center', marginBottom: 32 }}>
            {/* Pie chart dinâmico com SVG */}
            <Svg width={circleSize} height={circleSize} style={{ marginBottom: 20 }}>
                <G>
                    {renderPieSlices()}
                </G>
            </Svg>
        </View>
    );
};

export default SimplePieChart;
