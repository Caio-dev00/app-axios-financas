// Componente personalizado de gráfico de pizza
import { ThemedText } from "@/components/ThemedText";
import React from 'react';
import { View } from 'react-native';

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
    
    // Dimensões do "gráfico" - um pouco maior para melhor visualização
    const circleSize = Math.min(width * 0.48, height * 0.58);
    
    // Design mais moderno para o gráfico de pizza
    return (
        <View style={{ width, height, alignItems: 'center' }}>
            {/* Círculo colorido com design moderno e efeito visual */}
            <View style={{
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize/2,
                backgroundColor: data[0]?.color || '#cccccc',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.16,
                shadowRadius: 6,
                elevation: 5,
                marginBottom: 20,
                position: 'relative',
                borderWidth: 6,
                borderColor: 'white'
            }}>
                {/* Pequeno círculo de destaque para dar um efeito visual */}
                <View style={{
                    position: 'absolute',
                    top: circleSize * 0.1,
                    left: circleSize * 0.1,
                    width: circleSize * 0.15,
                    height: circleSize * 0.15,
                    borderRadius: circleSize * 0.075,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                }} />
            </View>
            
            {/* Legenda abaixo do gráfico - design moderno */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                paddingHorizontal: 10,
                width: width * 0.9,
                marginTop: 12
            }}>
                {data.map((item, index) => {
                    if (!item || !item.value) return null;
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                        <View key={`legend-${index}`} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginHorizontal: 8,
                            marginBottom: 10,
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            backgroundColor: 'rgba(245, 245, 245, 0.6)',
                            borderRadius: 20,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 1,
                            elevation: 1,
                        }}>
                            <View style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: item.color,
                                marginRight: 6
                            }} />                            <ThemedText style={{ fontSize: 13, fontWeight: '500' }}>
                                {item.name} ({percentage}%)
                            </ThemedText>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default SimplePieChart;
