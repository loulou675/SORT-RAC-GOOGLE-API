import { supabase } from '../lib/supabase/client'
import type { BinCode, InputMethod } from '../types/domain'

interface ScanEventInput {
  predictedItemCode?: string
  confirmedItemCode?: string
  inputMethod: InputMethod
  resultStatus: 'success' | 'error' | 'special_handling'
  destinationBinCode?: BinCode
  errorCode?: string
}

export async function recordScanEvent(input: ScanEventInput) {
  if (!supabase) {
    return
  }

  await supabase.from('scan_events').insert({
    site_id: null,
    predicted_item_code: input.predictedItemCode,
    confirmed_item_id: null,
    input_method: input.inputMethod,
    result_status: input.resultStatus,
    destination_bin_id: null,
    error_code: input.errorCode,
  })
}
