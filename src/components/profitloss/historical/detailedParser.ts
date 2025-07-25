
import { YearlyData, DetailedYearlyData } from './types';
import { conceptMapping, normalizeConceptName, isHeaderOrTotalLine } from './conceptMapping';
import { parseNumber } from './numberParser';
import { extractYearsFromHeader } from './yearExtractor';
import { convertDetailedToStandard, createEmptyDetailedYearlyData } from './dataConverter';

export const parseDetailedDataFromText = (text: string): YearlyData[] => {
  console.log('=== PARSE DETAILED DATA DEBUG ===');
  console.log('Input text length:', text.length);
  
  try {
    const lines = text.trim().split('\n').filter(line => line.trim());
    console.log('Number of lines:', lines.length);
    
    if (lines.length < 2) {
      throw new Error('Los datos deben tener al menos una línea de encabezado y una línea de datos');
    }

    // Extraer años del encabezado
    const headerLine = lines[0];
    const years = extractYearsFromHeader(headerLine);
    
    console.log('Detected years:', years);
    
    if (years.length === 0) {
      throw new Error('No se encontraron años válidos en el encabezado. Asegúrate de que el encabezado contenga años como "Ejerc. 2023"');
    }

    // Inicializar datos para cada año
    const yearlyDataMap: { [year: number]: DetailedYearlyData } = {};
    years.forEach(year => {
      yearlyDataMap[year] = createEmptyDetailedYearlyData(year);
    });

    // Procesar cada línea de datos
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split('\t');
      if (parts.length < 2) continue; // Al menos concepto + 1 valor

      const rawConcept = parts[0].trim();
      const concept = normalizeConceptName(rawConcept);
      
      // Saltar líneas de totales y encabezados
      if (isHeaderOrTotalLine(concept)) {
        console.log(`Skipping header/total line: "${rawConcept}"`);
        continue;
      }
      
      const mappedField = conceptMapping[concept];

      console.log(`Line ${i}: "${rawConcept}" -> "${concept}" -> ${mappedField || 'UNMAPPED'}`);

      if (mappedField) {
        // Procesar valores para cada año (saltar columnas que parecen porcentajes)
        let dataColumnIndex = 1;
        for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
          const year = years[yearIndex];
          
          // Buscar la siguiente columna con datos válidos
          while (dataColumnIndex < parts.length) {
            const rawValue = parts[dataColumnIndex];
            
            // Si está vacío o es porcentaje, pasar a la siguiente columna
            if (!rawValue || rawValue.trim() === '' || rawValue.includes('%')) {
              dataColumnIndex++;
              continue;
            }
            
            // Procesar el valor
            const value = parseNumber(rawValue);
            console.log(`  Year ${year}: "${rawValue}" -> ${value}`);
            
            if (yearlyDataMap[year] && mappedField !== 'year') {
              (yearlyDataMap[year] as any)[mappedField] = value;
            }
            
            dataColumnIndex++;
            break;
          }
        }
      } else {
        console.log(`Concept not mapped: "${rawConcept}" -> "${concept}"`);
      }
    }

    // Convertir a formato YearlyData estándar
    const result: YearlyData[] = years.map(year => {
      const detailed = yearlyDataMap[year];
      return convertDetailedToStandard(detailed);
    });

    console.log('Final parsed data:', result.length, 'years');
    if (result.length > 0) {
      console.log('Sample data for year', result[0].year, ':', {
        net_sales: result[0].net_sales,
        food_cost: result[0].food_cost,
        paper_cost: result[0].paper_cost,
        crew_labor: result[0].crew_labor
      });
    }
    return result;

  } catch (error) {
    console.error('Error parsing detailed data:', error);
    throw new Error('Error al procesar los datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  }
};
