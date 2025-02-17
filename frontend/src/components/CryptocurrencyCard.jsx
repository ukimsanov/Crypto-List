import {Card} from "antd"

function CryptocurrencyCard(props) {

    const { currency } = props

    const price = currency.quote.USD.price.toLocaleString();
    const percentChange24 = currency.quote.USD.percent_change_24h.toFixed(2);
    const colorChange = percentChange24 >= 0 ? 'text-green-500' : 'text-red-500';
    const marketCap = formatNumber(currency.quote.USD.market_cap);
    

    return (
      <div>
        <Card
        title={
            <div className="flex items-center gap-3">
                <img src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${currency.id}.png`}/>
                <span>{currency.name}</span>
            </div>
        }
        style={{
            width: 300,
        }}
        >
        <p>Current price: ${price}</p>
        <p>24h Change: <span className={`${colorChange}`}>{percentChange24}%</span></p>
        <p>Market Cap: ${marketCap}</p>
        </Card>
      </div>
    )
  }

  function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    } else {
        return num.toFixed(2);
    }
}
  
  export default CryptocurrencyCard
  