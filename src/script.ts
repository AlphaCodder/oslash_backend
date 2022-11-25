import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

type stats = {
    operationName: string
    duration: number
    status: boolean
}

async function main(){
 const allLinks = await prisma.stats.create({
    data: {
        operation: "getUrl",
        success: true,
        resTime: 100,
    }
})
 console.log(allLinks)
}

main()
 .finally(async () => {
 await prisma.$disconnect()
 })
