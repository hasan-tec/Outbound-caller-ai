import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'

export interface CallLogTable {
  id: Generated<number>
  number: string
  name: string // Add name field
  status: ColumnType<string, string | undefined, 'pending'>
  duration: string | null
  agent: number
  records: string | null
  call_sid: string | null
  created_at: ColumnType<string | undefined, never>
  updated_at: ColumnType<string | undefined, string>
}

export type CallLog = Selectable<CallLogTable>
export type NewCallLog = Insertable<CallLogTable>
export type CallLogUpdate = Updateable<CallLogTable>

export interface AgentTable {
  id: Generated<number>
  name: string
  prompt: string
}

export type Agent = Selectable<AgentTable>
export type NewAgent = Insertable<AgentTable>
export type AgentUpdate = Updateable<AgentTable>

export interface Database {
  call_log: CallLogTable;
  agent: AgentTable;
}

export interface SystemConfigTable {
  id: Generated<number>
  key: string
  value: string
  created_at: ColumnType<string | undefined, never>
  updated_at: ColumnType<string | undefined, string>
}

export type SystemConfig = Selectable<SystemConfigTable>
export type NewSystemConfig = Insertable<SystemConfigTable>
export type SystemConfigUpdate = Updateable<SystemConfigTable>
