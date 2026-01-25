
import { PrismaClient } from "@prisma/client";
import { create } from "domain";
import { url } from "inspector";


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
    await prisma.image.deleteMany();
    await prisma.table.deleteMany();

    const foodCategory = await prisma.category.create({
        data: {
            name: "Đồ ăn",
            products: {
                create: [
                    { 
                        name: "Phở bò", 
                        price: 50000,
                        description: "Phở bò tái chín, nước dùng thơm ngon, bánh phở mềm mại.",
                        images: {
                            create: {
                                url: "https://example.com/images/tra_da_1.jpg",
                                isPrimary: true,
                            }
                        },
                        quantity: 100, 
                    },
                    { 
                        name: "Bún chả", 
                        price: 45000,
                        description: "Bún chả Hà Nội với thịt nướng thơm lừng, nước mắm chua ngọt.",
                        images: {
                            create: {
                                url: "https://example.com/images/tra_da_1.jpg",
                                isPrimary: true,
                            }
                        },
                        quantity: 100, 
                    },
                    { 
                        name: "Cơm tấm", 
                        price: 40000,
                        description: "Cơm tấm sườn bì chả, ăn kèm với đồ chua và nước mắm pha.",
                        images: {
                            create: {
                                url: "https://example.com/images/tra_da_1.jpg",
                                isPrimary: true,
                            }
                        },
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
                        images: {
                            create: {
                                url: "https://example.com/images/tra_da_1.jpg",
                                isPrimary: true,
                            }
                        },
                        quantity: 200,
                    },
                    { 
                        name: "Cà phê sữa đá", 
                        price: 20000,
                        description: "Cà phê đen pha với sữa đặc, uống đá thơm ngon.",
                        images: {
                            create: {
                                url: "https://example.com/images/tra_da_1.jpg",
                                isPrimary: true,
                            }
                        },
                        quantity: 150, 
                    },
                    { 
                        name: "Nước cam ép", 
                        price: 25000,
                        description: "Nước cam tươi ép nguyên chất, không đường.",
                        images: {
                            create: {
                                url: "https://example.com/images/tra_da_1.jpg",
                                isPrimary: true,
                            }
                        },
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