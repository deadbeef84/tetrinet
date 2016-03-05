export default class Block {
    constructor(rndType, rndRot) {
        this.x = 0;
        this.y = 0;
        this.type = rndType % Block.blockData.length;
        this.rotation = rndRot % Block.blockData[this.type].length;
        this.data = Block.blockData[this.type][this.rotation];
    }

    rotate(r) {
        this.setRotation(this.rotation + r);
    }

    setRotation(r) {
        const numRotations = Block.blockData[this.type].length;
        if (r < 0)
            r = numRotations + r;
        this.rotation = r % numRotations;
        this.data = Block.blockData[this.type][this.rotation];
    }

    getBoundingBox() {
        const bb = {
            minx: 1000,
            maxx: 0,
            miny: 1000,
            maxy: 0
        };
        for(let i = 0; i < this.data.length; ++i) {
            bb.minx = Math.min(bb.minx, this.data[i][0]);
            bb.maxx = Math.max(bb.maxx, this.data[i][0]);
            bb.miny = Math.min(bb.miny, this.data[i][1]);
            bb.maxy = Math.max(bb.maxy, this.data[i][1]);
        }
        return bb;
    }

    hasPieceAt(x, y) {
        const lx = x - this.x, ly = y - this.y;
        for(let i = 0; i < this.data.length; ++i) {
            if(lx == this.data[i][0] && ly == this.data[i][1])
                return true;
        }
        return false;
    }
}

Block.blockData = [
	// O
	[[[1,0],[2,0],[1,1],[2,1]]],
	// I
	[
	[[0,1],[1,1],[2,1],[3,1]],
	[[2,0],[2,1],[2,2],[2,3]],
	[[0,2],[1,2],[2,2],[3,2]],
	[[1,0],[1,1],[1,2],[1,3]]
	],
	// T
	[
	[[1,0],[0,1],[1,1],[2,1]],
	[[1,0],[1,1],[2,1],[1,2]],
	[[0,1],[1,1],[2,1],[1,2]],
	[[1,0],[0,1],[1,1],[1,2]]
	],
	// L
	[
	[[2,0],[0,1],[1,1],[2,1]],
	[[1,0],[1,1],[1,2],[2,2]],
	[[0,1],[1,1],[2,1],[0,2]],
	[[0,0],[1,0],[1,1],[1,2]]
	],
	// J
	[
	[[0,0],[0,1],[1,1],[2,1]],
	[[1,0],[2,0],[1,1],[1,2]],
	[[0,1],[1,1],[2,1],[2,2]],
	[[1,0],[1,1],[0,2],[1,2]]
	],
	// Z
	[
	[[0,0],[1,0],[1,1],[2,1]],
	[[2,0],[1,1],[2,1],[1,2]],
	[[0,1],[1,1],[1,2],[2,2]],
	[[1,0],[0,1],[1,1],[0,2]]
	],
	// S
	[
	[[1,0],[2,0],[0,1],[1,1]],
	[[1,0],[1,1],[2,1],[2,2]],
	[[1,1],[2,1],[0,2],[1,2]],
	[[0,0],[0,1],[1,1],[1,2]]
	]
];
