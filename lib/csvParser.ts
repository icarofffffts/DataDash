import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';
import { Ticket } from '../types';

export const parseCSV = (file: File): Promise<Ticket[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = results.data.map((row: any) => {
            // Handle different header names between the two CSV formats
            const protocolo = row['Protocolo'] || '';
            const agente = row['Agente'] || '';
            const grupo = row['Grupo'] || row['Nome do Grupo'] || '';
            
            const rawDataInicial = row['Data Inicial'] || row['Criado em'] || '';
            const rawDataEncerramento = row['Data de encerramento'] || row['Fechado em'] || '';
            
            const cliente = row['Cliente'];
            const documento = row['CPF/CNPJ'];
            const telefone = row['Telefone'] || '';
            const canal = row['Canal'];
            const status = row['Status'] || '';
            const chamadaAtiva = row['Chamada ativa'] === 'true' || row['Chamada ativa'] === 'TRUE';

            const parseDate = (dateStr: string) => {
              if (!dateStr || dateStr === 'null') return null;
              // Format: DD-MM-YYYY HH:mm
              const parsedDate = parse(dateStr, 'dd-MM-yyyy HH:mm', new Date());
              return isValid(parsedDate) ? parsedDate : null;
            };

            return {
              protocolo,
              agente,
              grupo,
              dataInicial: parseDate(rawDataInicial),
              dataEncerramento: parseDate(rawDataEncerramento),
              cliente,
              documento,
              telefone,
              canal,
              status,
              chamadaAtiva,
              raw: row,
            } as Ticket;
          });
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
