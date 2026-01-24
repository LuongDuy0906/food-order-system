
import { PrismaClient } from "@prisma/client";
import { create } from "domain";


const prisma = new PrismaClient();

async function main() {
    console.log("Đang tạo dữ liệu mẫu...");

    const admin = await prisma.user.upsert({
        where: {username: "admin"},
        update: {},
        create: {
            username: "admin",
            password: "$2a$10$TZ8eAvDqVYLYuHDoEzPokekzj1qjd8ksn278yA5TXcTgwEFb9GVDm",
            role: "ADMIN",
        }
    });

    const waiter = await prisma.user.upsert({
        where: {username: "waiter"},
        update: {},
        create: {
            username: "waiter",
            password: "$2a$10$Q4XO12MkW4Sr8rfv.lCxvOPmBagYNz5xNJMZIzMawyhYLpbvSAbTi",
            role: "WAITER",
        }
    });

    const chef = await prisma.user.upsert({
        where: {username: "chef"},
        update: {},
        create: {
            username: "chef",
            password: "$2a$10$3zspXuuMMv.f1lbe0tTgMOCpkaJG60nUQmbxhXQYDuKU.v2dWTtsm",
            role: "CHEF",
        }
    });

    console.log("Khởi tạo thành công 3 người dùng.");

    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    const foodCategory = await prisma.category.create({
        data: {
            name: "Đồ ăn",
            products: {
                create: [
                    { 
                        name: "Phở bò", 
                        price: 50000,
                        description: "Phở bò tái chín, nước dùng thơm ngon, bánh phở mềm mại.",
                        image: "https://example.com/images/pho_bo.jpg",
                        quantity: 100, 
                    },
                    { 
                        name: "Bún chả", 
                        price: 45000,
                        description: "Bún chả Hà Nội với thịt nướng thơm lừng, nước mắm chua ngọt.",
                        image: "https://example.com/images/bun_cha.jpg",
                        quantity: 100, 
                    },
                    { 
                        name: "Cơm tấm", 
                        price: 40000,
                        description: "Cơm tấm sườn bì chả, ăn kèm với đồ chua và nước mắm pha.",
                        image: "https://example.com/images/com_tam.jpg",
                        quantity: 100,  
                    },
                ],    
            } 
        },
    });

    const drinkCategory =  await prisma.category.create({
        data: {
            name: "Đồ uống",
            products: {
                create: [
                    { 
                        name: "Trà đá",
                        price: 5000,
                        description: "Ly trà đá mát lạnh, giải khát tuyệt vời.",
                        image: "https://example.com/images/tra_da.jpg",
                        quantity: 200,
                    },
                    { 
                        name: "Cà phê sữa đá", 
                        price: 20000,
                        description: "Cà phê đen pha với sữa đặc, uống đá thơm ngon.",
                        image: "https://example.com/images/ca_phe_sua_da.jpg",
                        quantity: 150, 
                    },
                    { 
                        name: "Nước cam ép", 
                        price: 25000,
                        description: "Nước cam tươi ép nguyên chất, không đường.",
                        image: "https://example.com/images/nuoc_cam_ep.jpg",
                        quantity: 150,
                    },
                ],    
            } 
        },
    });

    console.log("Tạo thành công 2 danh mục và 6 sản phẩm mẫu.");
}

main()
    .then(async () => {
        console.log("Kết thúc quá trình tạo dữ liệu mẫu.");
    })
    .catch(async (e) => {
        console.error("Lỗi khi tạo dữ liệu mẫu:", e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });