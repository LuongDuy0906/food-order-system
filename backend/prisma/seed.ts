import { PrismaClient, Role, OrderStatus } from "@prisma/client";
import { randomInt } from "crypto";

const prisma = new PrismaClient();

async function main() {
    console.log("--- Bắt đầu quá trình Seed dữ liệu ---");

    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.image.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.table.deleteMany();
    await prisma.user.deleteMany();

    console.log("Đã dọn dẹp dữ liệu cũ.");

    const roles: Role[] = ["ADMIN", "CHEF", "WAITER", "WAITER", "WAITER", "CHEF", "WAITER", "CHEF", "WAITER", "WAITER"];
    const employees: any = [];
    for (let i = 1; i <= 10; i++) {
        const emp = await prisma.user.create({
            data: {
                name: `Nhân viên ${i}`,
                username: `user${i}`,
                password: "$2a$10$OyHZ2SeT1OEIyBIUShY8puLEtv5hcZM3jxcVZ7WeH4KzVXDfSTive",
                role: roles[i - 1]
            }
        });
        employees.push(emp);
    }
    console.log("Đã tạo 10 Employee & User");

    const categories: any = [];
    const categoryNames = ["Khai vị", "Món chính", "Tráng miệng", "Đồ uống"];
    for (const name of categoryNames) {
        const cat = await prisma.category.create({ data: { name } });
        categories.push(cat);
    }
    console.log("Đã tạo 10 Category");
    

    const products: any = [];
    for (let i = 1; i <= 10; i++) {
        const prod = await prisma.product.create({
            data: {
                name: `Sản phẩm ${i}`,
                description: `Mô tả chi tiết cho sản phẩm số ${i}`,
                price: 20000 * i,
                categoryId: categories[randomInt(4)].id,
                images: {
                    create: [
                        { url: `https://picsum.photos/seed/${i}/200`, isPrimary: true }
                    ]
                }
            }
        });
        products.push(prod);
    }
    console.log("Đã tạo 10 Product và 20 Image");

    const tables: any = [];
    for (let i = 1; i <= 10; i++) {
        const table = await prisma.table.create({
            data: {
                number: `B${i}`,
                capacity: i % 2 === 0 ? 4 : 2,
                floor: i <= 5 ? 1 : 2,
                isVip: i > 8,
            }
        });
        tables.push(table);
    }
    console.log("Đã tạo 10 Table");

    const orders: any = [];
    const statuses: OrderStatus[] = ["PAID", "COMPLETED", "PENDING", "IN_PROGRESS", "COMFIRMED", "PAID", "PENDING", "COMPLETED", "PAID", "PENDING"];
    for (let i = 0; i < 10; i++) {
        const order = await prisma.order.create({
            data: {
                tableId: tables[i].id,
                status: statuses[i],
                totalAmount: 0,
            }
        });
        orders.push(order);
    }
    console.log("Đã tạo 10 Order");

    for (let i = 0; i < 10; i++) {
        const qty = Math.floor(Math.random() * 3) + 1;
        const price = products[i].price;
        
        await prisma.orderItem.create({
            data: {
                orderId: orders[i].id,
                productId: products[i].id,
                quantity: qty,
                price: price,
                status: orders[i].status
            }
        });

        await prisma.order.update({
            where: { id: orders[i].id },
            data: { totalAmount: qty * price }
        });
    }
    console.log("Đã tạo 10 OrderItem và cập nhật TotalAmount");

    console.log("--- Hoàn thành Seed dữ liệu mẫu thành công ---");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });