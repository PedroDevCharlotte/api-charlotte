import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Estilos que replican el CSS del template HTML
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 10,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginVertical: 2,
  },
  tableRow: {
    flexDirection: 'row',
  },
  cell: {
    padding: 2,
    borderWidth: 1,
    borderColor: '#000000',
    textAlign: 'left',
    minHeight: 15,
    justifyContent: 'center',
  },
  cellCenter: {
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBold: {
    fontWeight: 'bold',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  headerCell: {
    backgroundColor: '#44b3e1',
    color: '#000000',
    fontWeight: 'bold',
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#000000',
    marginRight: 3,
    textAlign: 'center',
    fontSize: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  spacer: {
    height: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginVertical: 5,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  textArea: {
    minHeight: 40,
    padding: 5,
    borderWidth: 1,
    borderColor: '#000000',
    fontSize: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
});

// Función helper para formatear fechas
export const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-MX');
};

// Función helper para obtener estilos de checkbox
const getCheckboxStyle = (isChecked: boolean) => {
  return isChecked ? [styles.checkbox, styles.checkboxChecked] : [styles.checkbox];
};

// Función principal para crear el documento PDF usando solo componentes @react-pdf/renderer
export const createNonConformityPdf = (data: any) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.cell, styles.cellCenter, styles.headerCell, { width: '20%' }]}>
              <Text style={styles.cellBold}>A</Text>
            </View>
            <View style={[styles.cell, { width: '50%' }]}>
              <Text>TIPO DE DOCUMENTO:</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>CÓDIGO:</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, styles.cellBold, { width: '15%' }]}>
              <Text>FOR-CRI-08</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: '20%' }]}></View>
            <View style={[styles.cell, styles.cellCenter, styles.cellBold, { width: '50%' }]}>
              <Text>FORMATO</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>VERSIÓN:</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, styles.cellBold, { width: '15%' }]}>
              <Text>11</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: '20%' }]}></View>
            <View style={[styles.cell, { width: '50%' }]}>
              <Text>TÍTULO DE DOCUMENTO:</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>PÁGINA:</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>1 de 1</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: '20%' }]}></View>
            <View style={[styles.cell, styles.cellCenter, styles.cellBold, { width: '50%' }]}>
              <Text>REPORTE DE NO CONFORMIDAD Y ACCION CORRECTIVA</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>VIGENTE A PARTIR DE:</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>{data.validFrom || 'mar-25'}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: '20%' }]}></View>
            <View style={[styles.cell, { width: '50%' }]}></View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>VALIDO HASTA:</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '15%' }]}>
              <Text>{data.validTo || 'mar-28'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Información Principal */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text>Tipo</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text>Fecha de Elaboración</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text>Área y/o Proceso</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text>No. de No Conformidad</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: '25%' }]}>
              <View style={styles.checkboxRow}>
                <View style={getCheckboxStyle(data.typeOption?.displayText === 'SGC')}>
                  <Text style={{ fontSize: 8 }}>{data.typeOption?.displayText === 'SGC' ? '✓' : ''}</Text>
                </View>
                <Text>SGC</Text>
              </View>
              <View style={styles.checkboxRow}>
                <View style={getCheckboxStyle(data.typeOption?.displayText === 'SARI')}>
                  <Text style={{ fontSize: 8 }}>{data.typeOption?.displayText === 'SARI' ? '✓' : ''}</Text>
                </View>
                <Text>SARI</Text>
              </View>
              {data.otherType && (
                <View style={styles.checkboxRow}>
                  <View style={[styles.checkbox, styles.checkboxChecked]}>
                    <Text style={{ fontSize: 8 }}>✓</Text>
                  </View>
                  <Text>Otro: {data.otherType}</Text>
                </View>
              )}
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '25%' }]}>
              <Text>{formatDate(data.createdAtDate || data.detectedAt)}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '25%' }]}>
              <Text>{data.areaOrProcess || 'Cadena de Suministro'}</Text>
            </View>
            <View style={[styles.cell, styles.cellCenter, { width: '25%' }]}>
              <Text>{data.number}</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Motivo */}
        <Text style={styles.sectionTitle}>MOTIVO</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: '50%' }]}>
              <View style={styles.checkboxRow}>
                <View style={getCheckboxStyle(data.motiveOption?.displayText === 'Auditoria Interna')}>
                  <Text style={{ fontSize: 8 }}>{data.motiveOption?.displayText === 'Auditoria Interna' ? '✓' : ''}</Text>
                </View>
                <Text>Auditoria Interna</Text>
              </View>
              <View style={styles.checkboxRow}>
                <View style={getCheckboxStyle(data.motiveOption?.displayText === 'Auditoria Externa')}>
                  <Text style={{ fontSize: 8 }}>{data.motiveOption?.displayText === 'Auditoria Externa' ? '✓' : ''}</Text>
                </View>
                <Text>Auditoria Externa</Text>
              </View>
            </View>
            <View style={[styles.cell, { width: '50%' }]}>
              <View style={styles.checkboxRow}>
                <View style={getCheckboxStyle(data.motiveOption?.displayText === 'Queja de Cliente')}>
                  <Text style={{ fontSize: 8 }}>{data.motiveOption?.displayText === 'Queja de Cliente' ? '✓' : ''}</Text>
                </View>
                <Text>Queja de Cliente</Text>
              </View>
              <View style={styles.checkboxRow}>
                <View style={getCheckboxStyle(data.motiveOption?.displayText === 'Revision por la Direccion')}>
                  <Text style={{ fontSize: 8 }}>{data.motiveOption?.displayText === 'Revision por la Direccion' ? '✓' : ''}</Text>
                </View>
                <Text>Revision por la Direccion</Text>
              </View>
              {data.otherMotive && (
                <View style={styles.checkboxRow}>
                  <View style={[styles.checkbox, styles.checkboxChecked]}>
                    <Text style={{ fontSize: 8 }}>✓</Text>
                  </View>
                  <Text>Otro: {data.otherMotive}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Descripción del Hallazgo */}
        <Text style={styles.sectionTitle}>DESCRIPCIÓN DEL HALLAZGO</Text>
        <View style={styles.textArea}>
          <Text>{data.findingDescription || data.observations || ''}</Text>
        </View>

        <View style={styles.spacer} />

        {/* Causa */}
        <Text style={styles.sectionTitle}>CAUSA</Text>
        <View style={styles.textArea}>
          <Text>{data.cause || ''}</Text>
        </View>

        <View style={styles.spacer} />

        {/* Determinación de Causa Raíz */}
        <Text style={styles.sectionTitle}>DETERMINACIÓN DE CAUSA RAÍZ</Text>
        <View style={styles.textArea}>
          <Text>{data.rootCauseDetermination || ''}</Text>
        </View>

        {/* Planes de Acción */}
        {data.actionPlans && data.actionPlans.length > 0 && (
          <>
            <View style={styles.spacer} />
            <Text style={styles.sectionTitle}>PLANES DE ACCIÓN</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.headerCell, { width: '10%' }]}>
                  <Text>Tipo</Text>
                </View>
                <View style={[styles.cell, styles.headerCell, { width: '50%' }]}>
                  <Text>Descripción</Text>
                </View>
                <View style={[styles.cell, styles.headerCell, { width: '20%' }]}>
                  <Text>Fecha Compromiso</Text>
                </View>
                <View style={[styles.cell, styles.headerCell, { width: '20%' }]}>
                  <Text>Responsable</Text>
                </View>
              </View>
              {data.actionPlans.map((plan: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.cell, { width: '10%' }]}>
                    <Text>{plan.type === 'principal' ? 'Principal' : 'Secundaria'}</Text>
                  </View>
                  <View style={[styles.cell, { width: '50%' }]}>
                    <Text>{plan.description}</Text>
                  </View>
                  <View style={[styles.cell, { width: '20%' }]}>
                    <Text>{formatDate(plan.commitmentDate)}</Text>
                  </View>
                  <View style={[styles.cell, { width: '20%' }]}>
                    <Text>{plan.responsibleOptionId || 'N/A'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Análisis de 5 Porqués */}
        {data.whyRecords && data.whyRecords.length > 0 && (
          <>
            <View style={styles.spacer} />
            <Text style={styles.sectionTitle}>ANÁLISIS DE 5 PORQUÉS</Text>
            <View style={styles.table}>
              {data.whyRecords
                .filter((record: any) => record.type === 'WHY_HAD_PROBLEM')
                .map((record: any, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.cell, { width: '20%' }]}>
                      <Text>¿Por qué {record.questionNumber}?</Text>
                    </View>
                    <View style={[styles.cell, { width: '80%' }]}>
                      <Text>{record.answer}</Text>
                    </View>
                  </View>
                ))}
            </View>

            <View style={styles.spacer} />
            <Text style={styles.sectionTitle}>¿POR QUÉ NO FUE DETECTADO?</Text>
            <View style={styles.table}>
              {data.whyRecords
                .filter((record: any) => record.type === 'WHY_NOT_DETECTED')
                .map((record: any, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.cell, { width: '20%' }]}>
                      <Text>¿Por qué {record.questionNumber}?</Text>
                    </View>
                    <View style={[styles.cell, { width: '80%' }]}>
                      <Text>{record.answer}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
};