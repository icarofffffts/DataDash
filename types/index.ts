export interface Ticket {
  protocolo: string;
  agente: string;
  grupo: string;
  dataInicial: Date | null;
  dataEncerramento: Date | null;
  cliente?: string;
  documento?: string;
  telefone: string;
  canal?: string;
  status: string;
  chamadaAtiva: boolean;
  raw: any;
}
