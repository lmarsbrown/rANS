 
let text = `
It turns out that matrices describing a scaling operation like this will always be symmetric. Not only that, but all symmetric matrices describe a scaling operation in some orthonormal basis. Take a moment to let that sink in. All that a symmetric matrix does is scale space.
Note: As a quick review, symmetric matrices are matrices that are equal to their transpose. This means that flipping them along their diagonal does not change them. Example:
1 2 3
2 5 6
3 6 7


Notation Time!
Now we are going to figure out how the heck to write this out using linear algebra notation. Our goal is to figure out how to express a symmetric matrix in terms of an orthonormal matrix, which describes the axes that are being scaled, and a diagonal matrix which describes how much each of these axes are scaled.

Let's define matrix Q as a set of orthonormal basis vectors. These are the vectors which our symmetric matrix S is scaling.
Let’s also define matrix D as a diagonal matrix which describes the amount that all of these axes are going to be scaled.

We can recreate the transform that our symmetric matrix does by changing into basis Q, scaling using matrix S and then changing back out of matrix Q.
`;


let symbolToIndMap = {};
let indToSymbolMap = [];
let rawFreqs = [];
let freqTotal = 0;

let entropy = 0;

{
    let freqMap = {};
    for(let i = 0; i < text.length; i++)
    {
        if(freqMap[text[i]] == undefined)
        {
            freqMap[text[i]] = 0;
        }
        freqMap[text[i]]++;
        freqTotal++;
    }
    let keys = Object.keys(freqMap);
    let sortingArray = [];
    for(let i = 0 ; i < keys.length; i++)
    {
        sortingArray.push([freqMap[keys[i]],keys[i]]);
    }
    sortingArray.sort((a,b)=>{
        return b[0]-a[0];
    });
    console.log(sortingArray)
    for(let i = 0; i < sortingArray.length; i++)
    {
        entropy += -sortingArray[i][0]*Math.log2(sortingArray[i][0]/freqTotal);
        symbolToIndMap[sortingArray[i][1]] = i;
        indToSymbolMap.push(sortingArray[i][1]);
        rawFreqs.push(sortingArray[i][0]);
    }
}


class rANSCoder
{
    constructor(frequencies,frequencyTotal,freqDownscale=1)
    {
        this.table = [];
        this.mapLength = 2**Math.floor(Math.log2(frequencyTotal))/freqDownscale;
        this.freqs = [];
        
        // Scale frequencies so that they sum to a power of 2
        let roundedFreqCount = 0;
        for(let i = frequencies.length-1; i >= 0; i--)
        {
            this.freqs[i] = Math.ceil(frequencies[i]*this.mapLength/frequencyTotal);
            roundedFreqCount+=this.freqs[i];
        }
        let freqError = roundedFreqCount - this.mapLength;
        let removalInd = 0;

        while(freqError!=0)
        {
            let removal = Math.min(freqError,Math.floor(this.freqs[removalInd]*0.1));
            this.freqs[removalInd] -= removal;
            freqError -= removal;

            removalInd++;
            removalInd %= this.freqs.length;
        }

        this.summedFreqs = [0];
        for(let i = 0; i < this.freqs.length; i++)
        {
            this.summedFreqs.push(this.summedFreqs[i]+this.freqs[i]);
            this.table[this.summedFreqs[i]] = i;
        }

        let lastValidVal;
        for(let i = 0; i < this.mapLength; i++)
        {
            if(this.table[i] != undefined)
            {
                lastValidVal = this.table[i];
            }
            this.table[i] = lastValidVal;
        }

        this.M = 10;
    }
    encode(values)
    {

        let x = (1<<this.M)+1;

        let n = Math.log2(this.mapLength);

        let entropy = 0;
        for(let i = 0; i < values.length; i++)
        {
            entropy += -Math.log2(this.freqs[values[i]]/this.mapLength);
        }
        
        let buffer = new Uint8Array(Math.ceil(1.5*entropy/8));
        let currentBit = 0;

        for(let i = 0; i < values.length; i++)
        {

            let digit = values[i];
            let newX = (Math.floor(x / this.freqs[digit])<<n)+(x%this.freqs[digit])+this.summedFreqs[digit];
        
            if(newX>(2**(2*this.M)-1))
            {
                for(let i = 0; i < this.M; i++)
                {
                    buffer[currentBit>>3] |= (x&1)<<(currentBit&7);
                    x >>=1;
                    currentBit++;
                }
            }
            x = (Math.floor(x / this.freqs[digit])<<n)+(x%this.freqs[digit])+this.summedFreqs[digit];
        }
        let out = new Uint8Array(Math.ceil(currentBit/8));
        for(let i = 0; i < out.length; i++)
        {
            out[i] = buffer[i];
        }

        return {
            bits:out,
            x:x,
            bitCount: currentBit
        };
    }
    decode(encoded)
    {
        let decoded = [];
        let n = Math.log2(this.mapLength);

        let x = encoded.x;
        let currentBit = encoded.bitCount-1;




        while(currentBit > 0)
        {
            let section = x & (this.mapLength-1);
            let digit = this.table[section];
            decoded.push(digit);

            let remainder = section - this.summedFreqs[digit];

            x = (x>>n)*this.freqs[digit] + remainder;

            if(x<2**this.M)
            {
                for(let i = 0; i < this.M; i++)
                {
                    x<<=1;
                    x|=(encoded.bits[currentBit>>3] >> (currentBit&7))&1;
                    currentBit --;
                }
            }
        }
        return decoded;
    }
}

let encoder = new rANSCoder(rawFreqs,freqTotal,1);
let data = [];

for(let i = 0; i < text.length; i++)
{
    data.push(symbolToIndMap[text[i]]);
}

let encodedData = encoder.encode(data);

let decoded = encoder.decode(encodedData)

// let mapLength = 2**Math.floor(Math.log2(freqTotal));
// let freqs = [];
// let summedFreqs = [0];

// // Scale frequencies so that they sum to a power of 2
// let roundedFreqCount = 0;


// for(let i = rawFreqs.length-1; i >= 0; i--)
// {
//     freqs[i] = Math.ceil(rawFreqs[i]*mapLength/freqTotal);
//     roundedFreqCount+=freqs[i];
// }

// let freqError = roundedFreqCount - mapLength;
// let removalInd = 0;

// while(freqError!=0)
// {
//     let removal = Math.min(freqError,Math.floor(freqs[removalInd]*0.1));
//     freqs[removalInd] -= removal;
//     freqError -= removal;

//     removalInd++;
//     removalInd %= freqs.length;
// }

// for(let i = 0; i < freqs.length; i ++)
// {
//     summedFreqs.push(summedFreqs[i]+freqs[i]);
// }

// let data = [];

// for(let i = 0; i < text.length; i++)
// {
//     data.push(symbolToIndMap[text[i]]);
// }


// let M = 10;

// let x = 2**M+1;
// let xArr = [];

// let n = Math.log2(mapLength);


// let bitStream = "";
// for(let i = 0; i < data.length; i++)
// {
//     xArr.push(x);

//     let digit = data[i];
//     let newX = (Math.floor(x / freqs[digit])<<n)+(x%freqs[digit])+summedFreqs[digit];

//     if(newX>(2**(2*M)-1))
//     {
//         for(let i = 0; i < M; i++)
//         {
//             bitStream += x&1;
//             x >>=1;
//         }
//     }
//     xArr.push(x);
//     x = (Math.floor(x / freqs[digit])<<n)+(x%freqs[digit])+summedFreqs[digit];
// }

// let decoded = [];

// let encodedSize = bitStream.length;


// for(let i = 0; i < data.length; i++)
// {
//     let section = x & (mapLength-1);
//     let digit = 0;
//     while(summedFreqs[digit]<=section)
//     {
//         digit++;
//     }
//     digit--;
//     decoded.push(digit);

//     let remainder = section - summedFreqs[digit];

//     x = (x>>n)*freqs[digit] + remainder;

// let mapLength = 2**Math.floor(Math.log2(freqTotal));
// let freqs = [];
// let summedFreqs = [0];

// // Scale frequencies so that they sum to a power of 2
// let roundedFreqCount = 0;


// for(let i = rawFreqs.length-1; i >= 0; i--)
// {
//     freqs[i] = Math.ceil(rawFreqs[i]*mapLength/freqTotal);
//     roundedFreqCount+=freqs[i];
// }

// let freqError = roundedFreqCount - mapLength;
// let removalInd = 0;

// while(freqError!=0)
// {
//     let removal = Math.min(freqError,Math.floor(freqs[removalInd]*0.1));
//     freqs[removalInd] -= removal;
//     freqError -= removal;

//     removalInd++;
//     removalInd %= freqs.length;
// }

// for(let i = 0; i < freqs.length; i ++)
// {
//     summedFreqs.push(summedFreqs[i]+freqs[i]);
// }

// let data = [];

// for(let i = 0; i < text.length; i++)
// {
//     data.push(symbolToIndMap[text[i]]);
// }


// let M = 10;

// let x = 2**M+1;
// let xArr = [];

// let n = Math.log2(mapLength);


// let bitStream = "";
// for(let i = 0; i < data.length; i++)
// {
//     xArr.push(x);

//     let digit = data[i];
//     let newX = (Math.floor(x / freqs[digit])<<n)+(x%freqs[digit])+summedFreqs[digit];

//     if(newX>(2**(2*M)-1))
//     {
//         for(let i = 0; i < M; i++)
//         {
//             bitStream += x&1;
//             x >>=1;
//         }
//     }
//     xArr.push(x);
//     x = (Math.floor(x / freqs[digit])<<n)+(x%freqs[digit])+summedFreqs[digit];
// }

// let decoded = [];

// let encodedSize = bitStream.length;


// for(let i = 0; i < data.length; i++)
// {
//     let section = x & (mapLength-1);
//     let digit = 0;
//     while(summedFreqs[digit]<=section)
//     {
//         digit++;
//     }
//     digit--;
//     decoded.push(digit);

//     let remainder = section - summedFreqs[digit];

//     x = (x>>n)*freqs[digit] + remainder;

//     if(x<2**M)
//     {
//         for(let i = 0; i < M; i++)
//         {
//             x<<=1;
//             x|=parseInt(bitStream[bitStream.length-1]);
//             bitStream = bitStream.slice(0, -1);
//         }
//     }
// }


// let decodedText = "";
// for(let i = decoded.length; i >=0; i--)
// {
//     decodedText += indToSymbolMap[decoded[i]]
// }
//     {
//         for(let i = 0; i < M; i++)
//         {
//             x<<=1;
//             x|=parseInt(bitStream[bitStream.length-1]);
//             bitStream = bitStream.slice(0, -1);
//         }
//     }
// }


// let decodedText = "";
// for(let i = decoded.length; i >=0; i--)
// {
//     decodedText += indToSymbolMap[decoded[i]]
// }