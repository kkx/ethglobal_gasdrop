/* eslint-disable */
import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { ErrorBoundary } from '@sentry/react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import SendFromBlock from '@/components/tx/SendFromBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import useAsync from '@/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'
import { getInteractionTitle } from '../utils'
import type { SafeAppsTxParams } from '.'
import { trackSafeAppTxCount } from '@/services/safe-apps/track-app-usage-count'
import { getTxOrigin } from '@/utils/transactions'
import { ApprovalEditor } from '../../tx/ApprovalEditor'
import { createMultiSendCallOnlyTx, createTx, dispatchSafeAppsTx, dispatchTxSigning } from '@/services/tx/tx-sender'
import useOnboard from '@/hooks/wallets/useOnboard'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Box, Typography } from '@mui/material'
import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { CUSTOM_RELAY_API_URL } from '@/config/constants'
import useSignMessageModal from '@/components/safe-apps/SignMessageModal/useSignMessageModal'
import useTxModal from '@/components/safe-apps/SafeAppsTxModal/useTxModal'
import { query } from '@/services/airstack/'
import { AIRSTAKE_API_KEY } from '@/config/constants'
import { init as airstackInit, useQuery } from '@airstack/airstack-react'

type ReviewSafeAppsTxProps = {
  safeAppsTx: SafeAppsTxParams
}

const ReviewSafeAppsTx = ({
  safeAppsTx: { txs, requestId, params, appId, app },
}: ReviewSafeAppsTxProps): ReactElement => {
  const { safe } = useSafeInfo()
  const onboard = useOnboard()
  const chain = useCurrentChain()
  const [txList, setTxList] = useState(txs)
  const [relayDone, setRelayDone] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<Error>()
  const [signMessageModalState, openSignMessageModal, closeSignMessageModal] = useSignMessageModal()
  const [txModalState, openTxModal, closeTxModal] = useTxModal()

  const isMultiSend = txList.length > 1

  const [safeTx, safeTxError] = useAsync<SafeTransaction | undefined>(async () => {
    const tx = isMultiSend ? await createMultiSendCallOnlyTx(txList) : await createTx(txList[0])

    if (params?.safeTxGas) {
      // FIXME: do it properly via the Core SDK
      // @ts-expect-error safeTxGas readonly
      tx.data.safeTxGas = params.safeTxGas
    }

    return tx
  }, [txList])

  // airstack query
  // using airstack data to to check if the user can be sponsored
  airstackInit(AIRSTAKE_API_KEY)
  const {
    data: airStakeData,
    loading: loadingDataFromAirStack,
    error: err,
  } = useQuery(query, { address: safe.address.value }, { cache: false })

  const handleSubmitWithAds = async () => {
    //const { signTx, executeTx, signRelayedTx } = useTxActions()
    setSubmitError(undefined)
    if (!safeTx || !onboard) return
    trackSafeAppTxCount(Number(appId))
    console.log(1)

    try {
      const signedTx = await dispatchTxSigning(safeTx, safe.version, onboard, safe.chainId)
      let requestData: any = signedTx.data
      requestData['signatures'] = signedTx.signatures.entries().next().value[1].data
      requestData['safeAddress'] = safe.address.value
      console.log(requestData['signatures'])
      console.log(JSON.stringify(requestData))
      const requestObject: RequestInit = {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
      closeSignMessageModal()
      closeTxModal()
      console.log(1111, CUSTOM_RELAY_API_URL + 'api/relayer/')
      const res = await fetch(CUSTOM_RELAY_API_URL + 'api/relayer/', requestObject)
      setRelayDone(true)
      console.log(res)
      //const signedTx = await signRelayedTx(safeTx)
      console.log(signedTx)
      console.log(requestObject)
    } catch (error) {
      console.log(error)
      console.log(error)
      setSubmitError(error as Error)
    }
  }
  const handleSubmit = async () => {
    setSubmitError(undefined)
    if (!safeTx || !onboard) return
    trackSafeAppTxCount(Number(appId))

    try {
      await dispatchSafeAppsTx(safeTx, requestId, onboard, safe.chainId)
    } catch (error) {
      setSubmitError(error as Error)
    }
  }

  const origin = useMemo(() => getTxOrigin(app), [app])

  return (
    <SignOrExecuteForm
      safeTx={safeTx}
      onSubmit={handleSubmitWithAds}
      relayDone={relayDone}
      error={safeTxError || submitError}
      origin={origin}
    >
      {loadingDataFromAirStack && <div>Loading data from airstack</div>}
      {!loadingDataFromAirStack && <div>onchain data loaded from airstack</div>}
      <>
        <ErrorBoundary fallback={<div>Error parsing data</div>}>
          <ApprovalEditor txs={txList} updateTxs={setTxList} />
        </ErrorBoundary>

        <SendFromBlock />

        {safeTx && (
          <>
            <SendToBlock address={safeTx.data.to} title={getInteractionTitle(safeTx.data.value || '', chain)} />
          </>
        )}
      </>
    </SignOrExecuteForm>
  )
}

export default ReviewSafeAppsTx
