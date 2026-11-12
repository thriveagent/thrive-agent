<p align="center"><img src="https://raw.githubusercontent.com/Dhkrmynti/thrive-agent/main/brand/logo.png" width="140" alt="THRIVE"></p>

<h1 align="center">thrive-agent</h1>

<p align="center"><b>Roots steady, blooms run.</b> THRIVE in your terminal.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/thrive-agent"><img src="https://img.shields.io/npm/v/thrive-agent?color=5b4fc4&label=npm" alt="npm"></a>
  <a href="https://github.com/Dhkrmynti/thrive-agent"><img src="https://img.shields.io/badge/github-thrive--agent-28233f?logo=github" alt="GitHub"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-8e81e6" alt="MIT"></a>
</p>

THRIVE is a growth agent on Robinhood Chain. Most of a portfolio sits in its **roots** (tokenized stocks and ETFs, USDG); a small share rides its **blooms** (Pons memecoins). Every five minutes six on-chain readings become a **season score** from 1 (winter) to 10 (full bloom). In full bloom it harvests bloom profit into the roots, in winter it plants blooms back with root money, in between it only moves on a large drift.

This package only **reads**. It holds no keys and signs nothing. Rebalancing happens in the web terminal, where your own wallet confirms every step.

## Use

```sh
npx thrive-agent                 # the season score, its six readings and the note
npx thrive-agent record          # the four house books and what Thrive AI did
npx thrive-agent picks           # memes that pass the rug scan right now
npx thrive-agent garden 0x…      # roots, blooms and the rebalance plan for any wallet
npx thrive-agent watch           # the score, refreshed every minute
```

Or install once and run `thrive`:

```sh
npm i -g thrive-agent
thrive
```

`THRIVE_URL` points the CLI at another THRIVE server, for example your own: `THRIVE_URL=http://127.0.0.1:5530 thrive`.

## The score

| Reading | Weight |
|---|---|
| Pons volume against its own baseline | 25% |
| Share of Pons volume that is buying | 25% |
| Pons launch rate | 10% |
| ETH 24 h move | 15% |
| SPY / QQQ token 24 h move | 10% |
| Tone of ETH and SPY headlines (VADER) | 15% |

Code computes the score, the rule and the picks. Claude only writes the short note under the number.

## Honest limits

The score describes the last few hours; it is not a forecast. Four public paper books, opened the same day with the same money, show whether following it helps. Stock tokens follow their stocks through on-chain pools and are not shares. Not financial advice. Not affiliated with Robinhood, Uniswap or Pons.

## License

MIT
