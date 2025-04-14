// Helper functions
async function ensureBaseChain() {
  const chainId = await frame.sdk.wallet.ethProvider.request({
    method: "eth_chainId",
  });
  const chainIdDecimal =
    typeof chainId === "number" ? chainId : Number.parseInt(chainId, 16);
  if (chainIdDecimal !== 8453) {
    await frame.sdk.wallet.ethProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }], // Base mainnet chainId
    });
  }
}

async function getConnectedWallet() {
  const accounts = await frame.sdk.wallet.ethProvider.request({
    method: "eth_requestAccounts",
  });
  if (!accounts || !accounts[0]) {
    throw new Error("No wallet connected");
  }
  return accounts[0];
}

function formatAmount(amount, decimals) {
  const wei = BigInt(Math.floor(amount * 10 ** decimals)).toString(16);
  return `0x${wei}`;
}

function formatAddress(address) {
  return address.slice(2).padStart(64, "0");
}

// Main transaction functions
async function sendETH(amt, to) {
  try {
    await ensureBaseChain();

    const from = await getConnectedWallet();
    const value = formatAmount(amt, 18);

    const txHash = await frame.sdk.wallet.ethProvider.request({
      method: "eth_sendTransaction",
      params: [{ from, to, value, gasLimit: 21000 }],
    });

    return txHash;
  } catch (error) {
    console.error("Error sending ETH:", error);
    alert(`Failed to send ETH: ${error.message}`);
  }
}

async function sendUSDC(amt, recipient) {
  try {
    await ensureBaseChain();

    const from = await getConnectedWallet();
    const to = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC on Base

    const amountHex = formatAmount(amt, 6); // USDC has 6 decimals
    const amountNoPrefix = amountHex.startsWith("0x")
      ? amountHex.slice(2)
      : amountHex;

    const transferFunctionSignature = "0xa9059cbb";
    const recipientPadded = formatAddress(recipient);
    const paddedAmount = amountNoPrefix.padStart(64, "0");

    const data = `${transferFunctionSignature}${recipientPadded}${paddedAmount}`;

    const txHash = await frame.sdk.wallet.ethProvider.request({
      method: "eth_sendTransaction",
      params: [{ from, to, data, value: "0x0" }],
    });
    
    return txHash;
  } catch (error) {
    console.error("Error sending USDC:", error);
    alert(`Failed to send USDC: ${error.message}`);
  }
}
