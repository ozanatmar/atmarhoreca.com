import { readFromSheet, TEMP_ADD_SHEET } from '@/lib/google-sheets'
import MartellatoPanel from './MartellatoPanel'

export default async function MartellatoImportPage() {
  let rows: string[][] = []
  let sheetError: string | null = null

  try {
    rows = await readFromSheet(TEMP_ADD_SHEET)
  } catch (e) {
    sheetError = (e as Error).message
  }

  return <MartellatoPanel initialRows={rows} sheetError={sheetError} />
}
