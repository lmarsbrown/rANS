let data = [1,3,8,4,5,3,4,9,7,5,0,1,9,8,4,2,3,1,9,0,1,3,2,9,3,8,4,7,3,5,2,6,9,5,4,1,7,9,4,3,8,0,4,3,5,2];

let summedFreqs = [
    0,
    1,
    2,
    3,
    4,
    6,
    8,
    10,
    12,
    14,
    16
]
let freqs = [1,1,1,1,2,2,2,2,2,2];

let x = 256;

let xArr = [];


let M = 12;

let bitStream = "";
for(let i = 0; i < data.length; i++)
{
    xArr.push(x);

    let digit = data[i];
    let newX = (Math.floor(x / freqs[digit])<<4)+(x%freqs[digit])+summedFreqs[digit];

    if(newX>(2**(2*M)-1))
    {
        for(let i = 0; i < M; i++)
        {
            bitStream += x&1;
            x >>=1;
        }
    }
    xArr.push(x);
    x = (Math.floor(x / freqs[digit])<<4)+(x%freqs[digit])+summedFreqs[digit];
}

let decoded = [];


for(let i = 0; i < data.length; i++)
{
    let section = x & 15;
    let digit = 0;
    while(summedFreqs[digit]<=section)
    {
        digit++;
    }
    digit--;
    decoded.push(digit);

    let remainder = section - summedFreqs[digit];

    x = (x>>4)*freqs[digit] + remainder;

    if(x<2**M)
    {
        for(let i = 0; i < M; i++)
        {
            x<<=1;
            x|=parseInt(bitStream[bitStream.length-1]);
            bitStream = bitStream.slice(0, -1);
        }
    }
}


