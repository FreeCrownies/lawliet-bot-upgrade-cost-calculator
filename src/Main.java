import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        printSeparation();
        System.out.println("Coded by Crown#0016");
        System.out.println("Write 'exit' to close the program");
        Scanner scanner = new Scanner(System.in);

        String upgrade;
        long startPrice = 0;
        boolean stop = false;
        boolean first = true;
        while (true) {
            printSeparation();
            System.out.print("Which Upgrade?\na - Fishing Robot (Daily)\nb - Fishing Net (Voice)\nc - Fishing Rod (Message)\nd - Work\n");
            if (stop) {
                stop = false;
            }
            upgrade = scanner.next();

            switch (upgrade.toLowerCase()) {
                case "exit": {
                    System.exit(1);
                    break;
                }
                case "a":
                case "c":
                case "d": {
                    startPrice = 25000;
                    break;
                }
                case "b": {
                    startPrice = 32000;
                    break;
                }
                default: {
                    stop = true;
                    break;
                }
            }

            if (stop) {
                System.out.printf("No results for %s\n", upgrade);
                continue;
            }

            System.out.println("Do you want to calculate the cost for a certain level (a) or the total cost up to a certain level (b)?");

            boolean validInput;
            do {
                String input = scanner.next();
                switch (input.toLowerCase()) {
                    case "a": {
                        System.out.println("Up to which level do you want to upgrade?");

                        validInput = true;
                        String level;
                        do {
                            level = scanner.next();
                            try {
                                int levelInt = Integer.parseInt(level) - 1;
                                long cost = NumberUtil.flattenLong(Math.round(Math.pow(getValue(levelInt), 1.02) * startPrice), 4);
                                System.out.printf("Cost: %s\n", NumberUtil.numberToString(cost));
                            } catch (NumberFormatException e) {
                                if (level.equalsIgnoreCase("exit"))
                                    System.exit(1);
                                System.out.println("The level has to be a natural number");
                                validInput = false;
                            }
                        } while (!validInput);

                        if (!first) {
                            System.out.print("Which Upgrade?\na - Fishing Robot (Daily)\nb - Fishing Net (Voice)\nc - Fishing Rod (Message)\nd - Work\n");
                        } else {
                            first = false;
                        }
                        break;
                    }
                    case "b": {
                        System.out.println("Up to which level should the costs be calculated?");

                        validInput = true;
                        String level;
                        do {
                            level = scanner.next();
                            try {
                                int levelInt = Integer.parseInt(level) - 1;
                                long cost = 0;
                                for (int i = 0; i < levelInt; i++) {
                                    cost += NumberUtil.flattenLong(Math.round(Math.pow(getValue(i), 1.02) * startPrice), 4);
                                }
                                System.out.printf("Cost: %s\n", NumberUtil.numberToString(cost));
                            } catch (NumberFormatException e) {
                                if (level.equalsIgnoreCase("exit"))
                                    System.exit(1);
                                System.out.println("The level has to be a natural number");
                                validInput = false;
                            }
                        } while (!validInput);
                        break;
                    }
                    default: {
                        System.out.printf("'%s' has not been recognized\n", input);
                        validInput = false;
                        break;
                    }
                }

            } while (!validInput);
        }
    }

    public static long getValue(long level) {
        long n = level + 1;
        return n * (n + 1) / 2;
    }

    private static void printSeparation() {
        System.out.println("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>");
    }
}
