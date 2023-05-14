from web3 import Web3
import os

provider_urls = {
    137: "https://polygon-mainnet.infura.io/v3/a4414f1d23214edd86338f2602eca940",
    10: "https://optimism-mainnet.infura.io/v3/a4414f1d23214edd86338f2602eca940",
    1: "https://mainnet.infura.io/v3/a4414f1d23214edd86338f2602eca940",
    100: "https://gnosis-mainnet.public.blastapi.io"
}

abi = """[{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enum Enum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address payable","name":"refundReceiver","type":"address"},{"internalType":"bytes","name":"signatures","type":"bytes"}],"name":"execTransaction","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]"""
relayer_address = os.environ['RELAYER_ADDRESS']
relayer_private_key = os.environ['RELAYER_PRIVATE']


def execSafeTransaction(safeAddress, to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, signatures, chainId=137):
    provider_url = provider_urls[chainId]
    w3 = Web3(Web3.HTTPProvider(provider_url))
    contract = w3.eth.contract(address=safeAddress, abi=abi)
    nonce = w3.eth.get_transaction_count(relayer_address)
    txn = contract.functions.execTransaction(to, int(value), data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, signatures).build_transaction({
        'from': relayer_address,
        'gas': 3000000,
        'gasPrice': w3.eth.gas_price,
        'nonce': nonce
    })

    signed_txn = w3.eth.account.sign_transaction(txn, relayer_private_key)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    return txn_receipt
