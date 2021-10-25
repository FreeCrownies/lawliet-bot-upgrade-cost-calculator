import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class NumberUtil {

    public static int countDigits(long value) {
        if (value == 0) {
            return 1;
        }

        int digits = 0;
        while (value != 0) {
            value /= 10;
            digits++;
        }
        return digits;
    }

    public static long flattenLong(long value, int sliceKeepDigits) {
        int digits = NumberUtil.countDigits(value);
        if (digits > sliceKeepDigits) {
            return (long) (Math.round(value / Math.pow(10, digits - sliceKeepDigits)) * Math.pow(10, digits - sliceKeepDigits));
        }
        return value;
    }

    public static String numberToString(long value) {
        DecimalFormat formatter = new DecimalFormat("#,###", DecimalFormatSymbols.getInstance(Locale.US));
        return formatter.format(value).replace(",", " ");
    }
}
