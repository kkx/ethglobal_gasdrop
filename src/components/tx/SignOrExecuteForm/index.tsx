/* eslint-disable */
import { type ReactElement, type ReactNode, type SyntheticEvent, useEffect, useState } from 'react'
import { Box, Button, DialogContent, Typography } from '@mui/material'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import ReactPlayer from 'react-player'

import useGasLimit from '@/hooks/useGasLimit'
import ErrorMessage from '@/components/tx/ErrorMessage'
import AdvancedParams, { type AdvancedParameters, useAdvancedParams } from '@/components/tx/AdvancedParams'
import DecodedTx from '../DecodedTx'
import ExecuteCheckbox from '../ExecuteCheckbox'
import { logError, Errors } from '@/services/exceptions'
import { useCurrentChain } from '@/hooks/useChains'
import { getTxOptions } from '@/utils/transactions'
import { TxSimulation } from '@/components/tx/TxSimulation'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useIsValidExecution from '@/hooks/useIsValidExecution'
import { createTx } from '@/services/tx/tx-sender'
import CheckWallet from '@/components/common/CheckWallet'
import { WrongChainWarning } from '../WrongChainWarning'
import { useImmediatelyExecutable, useIsExecutionLoop, useTxActions, useValidateNonce } from './hooks'
import UnknownContractError from './UnknownContractError'
import { useRelaysBySafe } from '@/hooks/useRemainingRelays'
import useWalletCanRelay from '@/hooks/useWalletCanRelay'
import { ExecutionMethod, ExecutionMethodSelector } from '../ExecutionMethodSelector'
import { hasRemainingRelays } from '@/utils/relaying'

type SignOrExecuteProps = {
  safeTx?: SafeTransaction
  txId?: string
  onSubmit: () => void
  children?: ReactNode
  error?: Error
  isExecutable?: boolean
  isRejection?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
}

const SignOrExecuteForm = ({
  safeTx,
  txId,
  onSubmit,
  children,
  onlyExecute = false,
  isExecutable = false,
  isRejection = false,
  disableSubmit = false,
  origin,
  ...props
}: SignOrExecuteProps): ReactElement => {
  //
  // Hooks & variables
  //
  const [shouldExecute, setShouldExecute] = useState<boolean>(true)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [adPlaying, setAdPlaying] = useState<boolean>(false)
  const [adShown, setAdShown] = useState<boolean>(false)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [tx, setTx] = useState<SafeTransaction | undefined>(safeTx)
  const [submitError, setSubmitError] = useState<Error | undefined>()

  // Hooks
  const isOwner = useIsSafeOwner()
  const currentChain = useCurrentChain()
  const { signTx, executeTx } = useTxActions()
  const [relays] = useRelaysBySafe()

  // Check that the transaction is executable
  const isCreation = !txId
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation
  const isCorrectNonce = useValidateNonce(tx)
  const isExecutionLoop = useIsExecutionLoop()
  const canExecute = isCorrectNonce && (isExecutable || isNewExecutableTx)

  // If checkbox is checked and the transaction is executable, execute it, otherwise sign it
  const willExecute = (onlyExecute || shouldExecute) && canExecute

  // We default to relay, but the option is only shown if we canRelay
  const [executionMethod, setExecutionMethod] = useState(ExecutionMethod.RELAY)

  // SC wallets can relay fully signed transactions
  const [walletCanRelay] = useWalletCanRelay(tx)

  // The transaction can/will be relayed
  const canRelay = hasRemainingRelays(relays) && !!walletCanRelay && willExecute
  const willRelay = canRelay && executionMethod === ExecutionMethod.RELAY

  // Synchronize the tx with the safeTx
  useEffect(() => setTx(safeTx), [safeTx])

  // Ad countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (secondsLeft > 0) setSecondsLeft(secondsLeft - 1)
      else setSecondsLeft(0)

      if (secondsLeft == 1) setAdPlaying(false)
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft])

  // Estimate gas limit
  const { gasLimit, gasLimitError, gasLimitLoading } = useGasLimit(willExecute ? tx : undefined)

  const [advancedParams, setAdvancedParams] = useAdvancedParams({
    nonce: tx?.data.nonce,
    gasLimit,
    safeTxGas: tx?.data.safeTxGas,
  })

  // Check if transaction will fail
  const { executionValidationError, isValidExecutionLoading } = useIsValidExecution(
    willExecute ? tx : undefined,
    advancedParams.gasLimit,
  )

  // Estimating gas
  const isEstimating = willExecute && gasLimitLoading
  // Nonce cannot be edited if the tx is already proposed, or signed, or it's a rejection
  const nonceReadonly = !isCreation || !!tx?.signatures.size || isRejection

  // Sign transaction
  const onSign = async (): Promise<string | undefined> => {
    return await signTx(tx, txId, origin)
  }

  // Execute transaction
  const onExecute = async (): Promise<string | undefined> => {
    const txOptions = getTxOptions(advancedParams, currentChain)
    return await executeTx(txOptions, tx, txId, origin, willRelay)
  }

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    // test airstack
    e.preventDefault()
    setSubmitError(undefined)

    if (!adShown) {
      setAdShown(true)
      setAdPlaying(true)
      setSecondsLeft(10)
      return
    }

    //try {
    //  await (willExecute ? onExecute() : onSign())
    //} catch (err) {
    //  logError(Errors._804, (err as Error).message)
    //  setIsSubmittable(true)
    //  setSubmitError(err as Error)
    //  return
    //}

    onSubmit()
  }

  // On advanced params submit (nonce, gas limit, price, etc), recreate the transaction
  const onAdvancedSubmit = async (data: AdvancedParameters) => {
    // If nonce was edited, create a new tx with that nonce
    if (tx && (data.nonce !== tx.data.nonce || data.safeTxGas !== tx.data.safeTxGas)) {
      try {
        setTx(await createTx({ ...tx.data, safeTxGas: data.safeTxGas }, data.nonce))
      } catch (err) {
        logError(Errors._103, (err as Error).message)
        return
      }
    }

    setAdvancedParams(data)
  }

  const cannotPropose = !isOwner && !onlyExecute // Can't sign or create a tx if not an owner
  const submitDisabled =
    !isSubmittable ||
    isEstimating ||
    !tx ||
    disableSubmit ||
    cannotPropose ||
    isValidExecutionLoading ||
    (willExecute && isExecutionLoop)

  const error = props.error || (willExecute ? gasLimitError || executionValidationError : undefined)

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        {!adPlaying ? children : ''}
        {adPlaying && (
          <div className="player-wrapper">
            <ReactPlayer
              className="react-player fixed-bottom"
              url="http://localhost:3000/videos/ad.mp4"
              width="100%"
              height="100%"
              controls={false}
              playing={true}
              muted
            />
          </div>
        )}
        {!adPlaying && <DecodedTx tx={tx} txId={txId} />}

        {!adPlaying && canRelay && (
          <Box
            sx={{
              '& > div': {
                marginTop: '-1px',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              },
            }}
          ></Box>
        )}
        {!adPlaying && (
          <TxSimulation
            gasLimit={advancedParams.gasLimit?.toNumber()}
            transactions={tx}
            canExecute={canExecute}
            disabled={submitDisabled}
          />
        )}

        {/* Warning message and switch button */}
        <WrongChainWarning />

        {/* Error messages */}
        {isSubmittable && cannotPropose ? (
          <ErrorMessage>
            You are currently not an owner of this Safe Account and won&apos;t be able to submit this transaction.
          </ErrorMessage>
        ) : willExecute && isExecutionLoop ? (
          <ErrorMessage>
            Cannot execute a transaction from the Safe Account itself, please connect a different account.
          </ErrorMessage>
        ) : error ? (
          <ErrorMessage error={error}>
            This transaction will most likely fail.{' '}
            {isNewExecutableTx
              ? 'To save gas costs, avoid creating the transaction.'
              : 'To save gas costs, reject this transaction.'}
          </ErrorMessage>
        ) : submitError ? (
          <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
        ) : (
          willExecute && <UnknownContractError />
        )}

        {/* Submit button */}
        <CheckWallet allowNonOwner={willExecute}>
          {(isOk) => (
            <Button variant="contained" type="submit" disabled={secondsLeft > 0}>
              {secondsLeft == 0 && adShown
                ? 'Submit'
                : !adShown
                ? 'Watch an Ad to continue'
                : secondsLeft + ' seconds left'}
            </Button>
          )}
        </CheckWallet>
      </DialogContent>
    </form>
  )
}

export default SignOrExecuteForm
